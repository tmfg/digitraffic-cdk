import "source-map-support/register";
import {
    Context,
    KinesisStreamEvent,
    KinesisStreamRecord,
    CloudWatchLogsDecodedData
} from "aws-lambda";

import * as AWSx from "aws-sdk";
import {CloudWatchLogsLogEventExtractedFields} from "aws-lambda/trigger/cloudwatch-logs";
import {
    buildFromMessage,
    extractJson,
    getIndexName,
    isNumeric, parseESReturnValue
} from "./util";
import {getAppFromSenderAccount, getEnvFromSenderAccount} from "./accounts";
const AWS = AWSx as any;
const zlib = require("zlib");

const knownAccounts: Account[] = JSON.parse(process.env.KNOWN_ACCOUNTS as string);
const creds = new AWS.EnvironmentCredentials("AWS");

const endpoint = process.env.ES_ENDPOINT as string;
const endpointParts = endpoint.match(/^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com$/) as string[];
const esEndpoint = new AWS.Endpoint(endpoint);
const region = endpointParts[2];

export const handler = (event: KinesisStreamEvent, context: Context, callback: any): void => {
    event.Records.forEach(function(record: KinesisStreamRecord) {
        let zippedInput = Buffer.from(record.kinesis.data, "base64");

        // decompress the input
        zlib.gunzip(zippedInput, function(error: any, buffer: any) {
            if (error) {
                context.fail(error);
                return;
            }

            // parse the input from JSON
            const awslogsData: CloudWatchLogsDecodedData = JSON.parse(
                buffer.toString("utf8")
            );

            // transform the input to Elasticsearch documents
            const elasticsearchBulkData = transform(awslogsData, knownAccounts);

            // skip control messages
            if (!elasticsearchBulkData) {
                console.log("Received a control message");
                context.succeed("Control message handled successfully");
                return;
            }
            postToES(elasticsearchBulkData,
                (error: any, success: any, statusCode: any, failedItems: any) => {
                    if (error) {
                        console.log('Error: ' + JSON.stringify(error, null, 2));
                    }

                    if (failedItems && failedItems.length > 0) {
                        console.log("failed items " + JSON.stringify(failedItems));
                    }
                });
        });
    });
};

export function postToES(doc: string, callback: any) {
    const req = new AWS.HttpRequest(esEndpoint);

    console.log("sending POST to es unCompressedSize=%d", doc.length);

    req.method = "POST";
    req.path = "/_bulk?pipeline=keyval";
    req.region = region;
    req.headers["presigned-expires"] = false;
    req.headers["Host"] = esEndpoint.host;
    req.body = doc;
    req.headers["Content-Type"] = "application/json";

    let signer = new AWS.Signers.V4(req, "es");
    signer.addAuthorization(creds, new Date());

    let send = new AWS.NodeHttpClient();
    send.handleRequest(
        req,
        null,
        function(httpResp: any) {
            let respBody = "";
            httpResp.on("data", function(chunk: any) {
                respBody += chunk;
            });
            httpResp.on("end", function(chunk: any) {
                const parsedValues = parseESReturnValue(httpResp, respBody);

//                console.log("Response: " + respBody);
                callback(null);
            });
        },
        function(err: any) {
            console.log("Error: " + err);
            callback(Error(err));
        }
    );
}

export function transform(payload: CloudWatchLogsDecodedData, knownAccounts: Account[]): string | null {
    if (payload.messageType === "CONTROL_MESSAGE") {
        return null;
    }

    let bulkRequestBody = "";

    payload.logEvents.forEach((logEvent: any) => {
        if (isLambdaLifecycleEvent(logEvent.message)) {
            return;
        }

        const app = getAppFromSenderAccount(payload.owner, knownAccounts);
        const env = getEnvFromSenderAccount(payload.owner, knownAccounts);
        const appName = `${app}-${env}-lambda`;

        const messageParts = logEvent.message.split("\t"); // timestamp, id, level, message

        let source = buildSource(logEvent.message, logEvent.extractedFields) as any;
        source["@id"] = logEvent.id;
        source["@timestamp"] = new Date(1 * logEvent.timestamp).toISOString();
        source["level"] = messageParts[2];
        source["message"] = messageParts[3];
        source["@log_group"] = payload.logGroup;
        source["@app"] = appName;
        source["fields"] = {app: appName};
        source["@transport_type"] = app;

        let action = { index: { _id: logEvent.id, _index: null } } as any;
        action.index._index = getIndexName(appName, logEvent.timestamp);
        action.index._type = 'doc';

        bulkRequestBody +=
            [JSON.stringify(action), JSON.stringify(source)].join("\n") + "\n";
    });
    return bulkRequestBody;
}

export function isLambdaLifecycleEvent(message: string) {
    return message.startsWith('START RequestId') || message.startsWith('END RequestId') || message.startsWith('REPORT RequestId');
}

export function buildSource(message: string, extractedFields: CloudWatchLogsLogEventExtractedFields | undefined): any {
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
        let source = new Array() as any;

        for (let key in extractedFields) {
            if (extractedFields.hasOwnProperty(key) && extractedFields[key]) {
                let value = extractedFields[key];

                if (isNumeric(value)) {
                    source[key] = 1 * (value as any);
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

    return buildFromMessage(message);
}
