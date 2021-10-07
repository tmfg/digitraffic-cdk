import "source-map-support/register";
import {
    Context,
    KinesisStreamEvent,
    KinesisStreamRecord,
    CloudWatchLogsDecodedData
} from "aws-lambda";

import * as AWSx from "aws-sdk";
import {
    buildFromMessage,
    extractJson, filterIds, getFailedIds,
    getIndexName, isControlMessage,
    isNumeric, parseESReturnValue
} from "./util";
import {getAppFromSenderAccount, getEnvFromSenderAccount} from "./accounts";
import {notifyFailedItems} from "./notify";
const AWS = AWSx as any;
const zlib = require("zlib");

const knownAccounts: Account[] = JSON.parse(process.env.KNOWN_ACCOUNTS as string);
const creds = new AWS.EnvironmentCredentials("AWS");

const endpoint = process.env.ES_ENDPOINT as string;
const endpointParts = endpoint.match(/^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com$/) as string[];
const esEndpoint = new AWS.Endpoint(endpoint);
const region = endpointParts[2];

const MAX_BODY_SIZE = 1000000;

export const handler = (event: KinesisStreamEvent, context: Context, callback: any): void => {
    const statistics = {};

    try {
        let batchBody = "";

        event.Records.forEach((record: KinesisStreamRecord) => {
            const recordBody = handleRecord(record, statistics);
            batchBody += recordBody;

            if (batchBody.length > MAX_BODY_SIZE) {
                postToElastic(context, true, batchBody);
                batchBody = "";
            }
        });

        if (batchBody.trim().length > 0) { // trim here since transform() adds line breaks even to filtered records
            postToElastic(context, true, batchBody);
        }
    } catch (e) {
        console.log('ERROR ', e);
    } finally {
        console.log("statistics " + JSON.stringify(statistics));
    }
};

function handleRecord(record: KinesisStreamRecord, statistics: any): string {
    const zippedInput = Buffer.from(record.kinesis.data, "base64");

    // decompress the input
    const ucompressed = zlib.gunzipSync(zippedInput).toString();

    // parse the input from JSON
    const awslogsData = JSON.parse(ucompressed.toString('utf8'));

    // skip control messages
    if (isControlMessage(awslogsData)) {
        console.log('Received a control message');
        return "";
    }

    return transform(awslogsData, statistics);
}

function postToElastic(context: any, retryOnFailure: boolean, elasticsearchBulkData: string) {
    // post documents to the Amazon Elasticsearch Service
    post(elasticsearchBulkData, (error: any, success: any, statusCode: any, failedItems: any) => {
        if (error) {
            console.log('Error: ' + JSON.stringify(error, null, 2));

            if (failedItems && failedItems.length > 0) {
                notifyFailedItems(failedItems);

                // try repost only once
                if (retryOnFailure) {
                    const failedIds = getFailedIds(failedItems);

                    console.log("reposting, failed ids " + failedIds);

                    // some items failed, try to repost
                    const filteredBulkData = filterIds(elasticsearchBulkData, failedIds);
                    postToElastic(context, false, filteredBulkData);
                }
            } else {
                context.fail(JSON.stringify(error));
            }
        }
    });
}

export function post(body: string, callback: any) {
    const req = new AWS.HttpRequest(esEndpoint);

    console.log("sending POST to es unCompressedSize=%d", body.length);

    if(body.length === 0) {
        return;
    }

    req.method = "POST";
    req.path = "/_bulk?pipeline=keyval";
    req.region = region;
    req.headers["presigned-expires"] = false;
    req.headers["Host"] = esEndpoint.host;
    req.body = body;
    req.headers["Content-Type"] = "application/json";

    const signer = new AWS.Signers.V4(req, "es");
    signer.addAuthorization(creds, new Date());

    const send = new AWS.NodeHttpClient();
    send.handleRequest(
        req,
        null,
        function(response: any) {
            let respBody = "";
            response.on("data", function(chunk: any) {
                respBody += chunk;
            });
            response.on("end", function(chunk: any) {
                const parsedValues = parseESReturnValue(response, respBody);

                callback(parsedValues.error, parsedValues.success, response.statusCode, parsedValues.failedItems);
            });
        },
        function(err: any) {
            console.log("Error: " + err);
            callback(Error(err));
        }
    );
}

export function transform(payload: CloudWatchLogsDecodedData, statistics: any, idsToFilter: string[] = []): string {
    const app = getAppFromSenderAccount(payload.owner, knownAccounts);
    const env = getEnvFromSenderAccount(payload.owner, knownAccounts);
    const appName = `${app}-${env}-lambda`;

    return payload.logEvents
        .filter((e: any) => !idsToFilter.includes(e.id))
        .filter((e: any) => !isLambdaLifecycleEvent(e.message))
        .map((logEvent: any) => {
            const messageParts = logEvent.message.split("\t"); // timestamp, id, level, message

            const source = buildSource(logEvent.message, logEvent.extractedFields);
            source["@id"] = logEvent.id;
            source["@timestamp"] = new Date(1 * logEvent.timestamp).toISOString();
            source["level"] = messageParts[2];
            source["message"] = messageParts[3];
            source["@log_group"] = payload.logGroup;
            source["@app"] = appName;
            source["fields"] = {app: appName};
            source["@transport_type"] = app;

            const action = { index: { _id: logEvent.id, _index: null } } as any;
            action.index._index = getIndexName(appName, logEvent.timestamp);
            action.index._type = 'doc';

            // update statistics
            if(!statistics[payload.logGroup]) {
                statistics[payload.logGroup] = 1;
            } else {
                statistics[payload.logGroup] = statistics[payload.logGroup] + 1;
            }

            return [JSON.stringify(action), JSON.stringify(source)].join("\n");
        }).join("\n") + "\n"; // must end with new-line
}

export function isLambdaLifecycleEvent(message: string) {
    return message.startsWith('START RequestId') || message.startsWith('END RequestId') || message.startsWith('REPORT RequestId');
}

export function buildSource(message: string, extractedFields: any): any {
    message = message.replace("[, ]", "[0.0,0.0]")
        .replace(/\n/g, "\\n")
        .replace(/\'/g, "\\'")
        .replace(/\"/g, '\\"')
        .replace(/\&/g, "\\&")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        .replace(/\b/g, "\\b")
        .replace(/\f/g, "\\f");

    if (extractedFields) {
        return buildFromExtractedFields(message, extractedFields);
    }

    return buildFromMessage(message, false);
}

function buildFromExtractedFields(message: string, extractedFields: any[]): any {
    const source = {} as any;

    for (const key in extractedFields) {
        if (extractedFields.hasOwnProperty(key) && extractedFields[key]) {
            const value = extractedFields[key];

            if (isNumeric(value)) {
                source[key] = 1 * value;
                continue;
            }

            if (value) {
                const jsonSubString = extractJson(value);
                if (jsonSubString !== null) {
                    source["$" + key] = JSON.parse(jsonSubString);
                }
            }

            source[key] = value;
        }
    }
    source.message = message;
    return source;
}
