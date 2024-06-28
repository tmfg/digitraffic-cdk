import "source-map-support/register";
import { Context, KinesisStreamRecord, CloudWatchLogsDecodedData, KinesisStreamHandler } from "aws-lambda";

import * as AWSx from "aws-sdk";
import {
    extractJson,
    filterIds,
    getFailedIds,
    getIndexName,
    isControlMessage,
    ItemStatus,
    parseESReturnValue,
    parseNumber
} from "./util";
import { getAppFromSenderAccount, getEnvFromSenderAccount } from "./accounts";
import { notifyFailedItems } from "./notify";
import { CloudWatchLogsLogEventExtractedFields } from "aws-lambda/trigger/cloudwatch-logs";
import { IncomingMessage } from "http";
import { Statistics } from "./statistics";
import { Account } from "../../app-props";
import zlib from "zlib";

const AWS = AWSx as any;

const knownAccounts: Account[] = JSON.parse(
    process.env.KNOWN_ACCOUNTS as unknown as string
) as unknown as Account[];
const creds = new AWS.EnvironmentCredentials("AWS");

const endpoint = process.env.ES_ENDPOINT as unknown as string;
const endpointParts = endpoint.match(/^([^.]+)\.?([^.]*)\.?([^.]*)\.amazonaws\.com$/) as string[];
const esEndpoint = new AWS.Endpoint(endpoint);
const region = endpointParts[2];

const MAX_BODY_SIZE = 3 * 1000 * 1000;
const SEPARATOR_LAMBDA_LOGS = "\t";

export const handler: KinesisStreamHandler = (event, context): void => {
    const statistics = new Statistics();

    try {
        let batchBody = "";

        event.Records.forEach((record: KinesisStreamRecord) => {
            const recordBody = handleRecord(record, statistics);

            if (recordBody.trim().length > 0) {
                batchBody += recordBody;

                if (batchBody.length > MAX_BODY_SIZE) {
                    postToElastic(context, true, batchBody);
                    batchBody = "";
                }
            }
        });

        if (batchBody.trim().length > 0) {
            // trim here since transform() adds line breaks even to filtered records
            postToElastic(context, true, batchBody);
        }
    } catch (e) {
        console.log("ERROR ", e);
    } finally {
        console.log("statistics " + JSON.stringify(statistics));
    }
};

function handleRecord(record: KinesisStreamRecord, statistics: Statistics): string {
    const zippedInput = Buffer.from(record.kinesis.data, "base64");

    // decompress the input
    const uncompressed = zlib.gunzipSync(zippedInput).toString("utf8");

    // parse the input from JSON
    const awslogsData = JSON.parse(uncompressed) as unknown as CloudWatchLogsDecodedData;

    // skip control messages
    if (isControlMessage(awslogsData)) {
        console.log("Received a control message");
        return "";
    }

    return transform(awslogsData, statistics);
}

function postToElastic(context: Context, retryOnFailure: boolean, elasticsearchBulkData: string) {
    // post documents to the Amazon Elasticsearch Service
    post(elasticsearchBulkData, (error: any, success: any, statusCode: number, failedItems: ItemStatus[]) => {
        if (error) {
            console.log("Error: " + JSON.stringify(error, null, 2));

            if (failedItems && failedItems.length > 0) {
                notifyFailedItems(failedItems);

                // try repost only once
                if (retryOnFailure) {
                    const failedIds = getFailedIds(failedItems);

                    console.log("reposting, failed ids " + failedIds.toString());

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
    const req = new AWS.HttpRequest(esEndpoint, region);

    console.log("sending POST to es unCompressedSize=%d", body.length);

    if (body.length === 0) {
        return;
    }

    req.method = "POST";
    req.path = "/_bulk?pipeline=keyval";
    req.headers["presigned-expires"] = "false";
    req.headers.Host = esEndpoint.host;
    req.body = body;
    req.headers["Content-Type"] = "application/json";

    const signer = new AWS.Signers.V4(req, "es");
    signer.addAuthorization(creds, new Date());

    const send = new AWS.NodeHttpClient();
    send.handleRequest(
        req,
        null,
        (response: IncomingMessage) => {
            let respBody = "";
            response.on("data", function (chunk: any) {
                respBody += chunk;
            });
            response.on("end", function (chunk: any) {
                const parsedValues = parseESReturnValue(response, respBody);

                callback(
                    parsedValues.error,
                    parsedValues.success,
                    response.statusCode,
                    parsedValues.failedItems
                );
            });
        },
        function (err: Error) {
            console.log("Error: " + err);
            callback(err);
        }
    );
}

export function transform(
    payload: CloudWatchLogsDecodedData,
    statistics: Statistics,
    idsToFilter: string[] = []
): string {
    const app = getAppFromSenderAccount(payload.owner, knownAccounts);
    const env = getEnvFromSenderAccount(payload.owner, knownAccounts);
    const appName = `${app}-${env}-lambda`;

    return (
        payload.logEvents
            .filter((e) => !idsToFilter.includes(e.id))
            .filter((e) => !isLambdaLifecycleEvent(e.message))
            .filter((e) => !isDebugLine(e.message))
            .map((logEvent) => {
                const messageParts = logEvent.message.split(SEPARATOR_LAMBDA_LOGS); // timestamp, id, level, message

                const source = buildSource(logEvent.message, logEvent.extractedFields);
                source["@id"] = logEvent.id;
                source["@timestamp"] = new Date(logEvent.timestamp).toISOString();
                source.level = messageParts[2];
                source.message = messageParts[3];
                source["@log_group"] = payload.logGroup;
                source["@app"] = appName;
                source.fields = { app: appName };
                source["@transport_type"] = app;

                const action = {
                    index: {
                        _id: logEvent.id,
                        _index: getIndexName(appName, logEvent.timestamp),
                        _type: "doc"
                    }
                };

                statistics.addStatistics(payload.logGroup);

                return [JSON.stringify(action), JSON.stringify(source)].join("\n");
            })
            .join("\n") + "\n"
    ); // must end with new-line
}

export function isLambdaLifecycleEvent(message: string) {
    return (
        message.startsWith("START RequestId") ||
        message.startsWith("END RequestId") ||
        message.startsWith("REPORT RequestId")
    );
}

export function buildSource(message: string, extractedFields?: CloudWatchLogsLogEventExtractedFields): any {
    message = message.replace("[, ]", "[0.0,0.0]");

    if (extractedFields) {
        return buildFromExtractedFields(message, extractedFields);
    }

    return buildFromMessage(message);
}

function buildFromMessage(message: string) {
    const logLine = message
        .replace("[, ]", "[0.0,0.0]")
        .replace(/"Infinity"/g, "-1")
        .replace(/Infinity/gi, "-1")
        .replace(/"null"/gi, "null");

    return {
        // eslint-disable-next-line camelcase
        log_line: logLine
    };
}

function isDebugLine(logline: string): boolean {
    // split by separator
    const split = logline.split(SEPARATOR_LAMBDA_LOGS);

    // split[0] timestamp
    // split[1] id
    // split[2] LOG level
    // split[3] log line

    return split.length > 3 && split[3].startsWith("DEBUG");
}

function buildFromExtractedFields(
    message: string,
    extractedFields: CloudWatchLogsLogEventExtractedFields
): unknown {
    const source = {} as any;

    for (const key in extractedFields) {
        if (extractedFields[key]) {
            const value = extractedFields[key] as string;

            const numValue = parseNumber(value);

            if (numValue) {
                source[key] = numValue;
            } else {
                const jsonSubString = extractJson(value);
                if (jsonSubString !== null) {
                    source["$" + key] = JSON.parse(jsonSubString);
                }

                source[key] = value;
            }
        }
    }
    source.message = message;
    return source;
}
