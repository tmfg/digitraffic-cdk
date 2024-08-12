import {
    buildFromMessage,
    type ESReturnValue,
    extractJson,
    filterIds,
    getFailedIds,
    getIndexName,
    isControlMessage,
    type ItemStatus,
    parseESReturnValue,
    parseNumber
} from "./util.js";
import type {
    CloudWatchLogsDecodedData,
    Context,
    KinesisStreamHandler,
    KinesisStreamRecord
} from "aws-lambda";
import { getAppFromSenderAccount } from "./accounts.js";
import { notifyFailedItems } from "./notify.js";
import type { CloudWatchLogsLogEventExtractedFields } from "aws-lambda";
import type { IncomingMessage } from "http";
import { Statistics } from "./statistics.js";
import type { Account } from "../../app-props.js";

import type { BinaryToTextEncoding } from "crypto";

import https from "https";
import zlib from "zlib";
import crypto from "crypto";

// eslint-disable-next-line dot-notation
const endpoint = process.env["ES_ENDPOINT"];
// eslint-disable-next-line dot-notation
const knownAccounts = JSON.parse(process.env["KNOWN_ACCOUNTS"]) as Account[];

const endpointParts = endpoint.match(/^([^.]+)\.?([^.]*)\.?([^.]*)\.amazonaws\.com$/) as string[];
const region = endpointParts[2];
const service = endpointParts[3];

const MAX_BODY_SIZE = 3 * 1000 * 1000;

export const handler: KinesisStreamHandler = function (event, context) {
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
        // eslint-disable-next-line no-console
        console.log("ERROR ", e);
    } finally {
        // eslint-disable-next-line no-console
        console.log("statistics " + JSON.stringify(statistics));
    }
};

function handleRecord(record: KinesisStreamRecord, statistics: Statistics): string {
    const zippedInput = Buffer.from(record.kinesis.data, "base64");

    // decompress the input
    const uncompressed = zlib.gunzipSync(zippedInput).toString();

    // parse the input from JSON
    const awslogsData = JSON.parse(uncompressed) as CloudWatchLogsDecodedData;

    // skip control messages
    if (isControlMessage(awslogsData)) {
        // eslint-disable-next-line no-console
        console.log("Received a control message");
        return "";
    }

    return transform(awslogsData, statistics);
}

function postToElastic(context: Context, retryOnFailure: boolean, elasticsearchBulkData: string) {
    // post documents to the Amazon Elasticsearch Service
    post(elasticsearchBulkData, (error, success, statusCode, failedItems: ItemStatus[] | undefined) => {
        if (error) {
            // eslint-disable-next-line no-console
            console.log("Error: " + JSON.stringify(error, null, 2));

            if (failedItems && failedItems.length > 0) {
                notifyFailedItems(failedItems);

                // try repost only once
                if (retryOnFailure) {
                    const failedIds = getFailedIds(failedItems);

                    // eslint-disable-next-line no-console
                    console.log("reposting, failed ids " + failedIds.join());

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

function transform(payload: CloudWatchLogsDecodedData, statistics: Statistics): string {
    let bulkRequestBody = "";

    const app = getAppFromSenderAccount(payload.owner, knownAccounts);
    const appName = getAppName(payload.logGroup, app);

    payload.logEvents.forEach((logEvent) => {
        const source = buildSource(logEvent.message, logEvent.extractedFields);

        source["@id"] = logEvent.id;
        source["@timestamp"] = new Date(logEvent.timestamp).toISOString();
        source["@owner"] = payload.owner;
        source["@log_group"] = payload.logGroup;
        source["@log_stream"] = payload.logStream;
        source["@transport_type"] = app;
        source["@app"] = appName;

        const action: { index: { _id?: string; _index?: string } } = { index: {} };
        const indexName = getIndexName(appName, logEvent.timestamp);
        action.index._id = logEvent.id;
        action.index._index = indexName;

        statistics.addStatistics(indexName);

        bulkRequestBody += [JSON.stringify(action), JSON.stringify(source)].join("\n") + "\n";
    });
    return bulkRequestBody;
}

function getAppName(logGroup: string, app: string): string {
    if (logGroup.includes("amazonmq")) {
        return `${app}-mqtt`;
    } else if (logGroup.includes("nginx")) {
        return "dt-nginx";
    }

    return logGroup;
}

export function buildSource(message: string, extractedFields?: CloudWatchLogsLogEventExtractedFields) {
    if (extractedFields) {
        return buildFromExtractedFields(extractedFields);
    }

    return buildFromMessage(message, true);
}

function buildFromExtractedFields(extractedFields: CloudWatchLogsLogEventExtractedFields): object {
    const source = {};

    for (const key in extractedFields) {
        if (extractedFields[key]) {
            const value = extractedFields[key];

            const numValue = parseNumber(value);

            if (numValue) {
                source[key] = numValue;
            } else {
                const jsonSubString = extractJson(value);
                if (jsonSubString !== null) {
                    source["$" + key] = JSON.parse(jsonSubString) as unknown;
                }

                source[key] = value;
            }
        }
    }

    return source;
}

type postCallback = (
    error: ESReturnValue["error"] | Error,
    success: ESReturnValue["success"],
    statusCode: IncomingMessage["statusCode"],
    failedItems: ESReturnValue["failedItems"]
) => void;

function post(body: string, callback: postCallback) {
    const requestParams = buildRequest(body);

    // eslint-disable-next-line no-console
    console.log("sending POST to es unCompressedSize=%d", body.length);

    if (body.length === 0) {
        return;
    }

    const request = https
        .request(requestParams, (response: IncomingMessage) => {
            let responseBody = "";
            response.on("data", function (chunk) {
                responseBody += chunk;
            });
            response.on("end", function () {
                const parsedValues = parseESReturnValue(response, responseBody);

                callback(
                    parsedValues.error,
                    parsedValues.success,
                    response.statusCode,
                    parsedValues.failedItems
                );
            });
        })
        .on("error", (e: Error) => {
            callback(e, undefined, undefined, undefined);
        });
    request.end(requestParams.body);
}

function buildRequest(body: string) {
    if (!region) {
        throw Error("Could not read region");
    }

    if (!service) {
        throw Error("Could not read service");
    }
    const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const date = datetime.substring(0, 8);
    // eslint-disable-next-line dot-notation
    const kDate = hmac("AWS4" + process.env["AWS_SECRET_ACCESS_KEY"], date);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, "aws4_request");

    const requestHeadersDefault = {
        "Content-Type": "application/json",
        Host: endpoint,
        "Content-Length": Buffer.byteLength(body),
        // eslint-disable-next-line dot-notation
        "X-Amz-Security-Token": process.env["AWS_SESSION_TOKEN"],
        "X-Amz-Date": datetime
    };

    const requestDefault = {
        host: endpoint,
        method: "POST",
        path: "/_bulk",
        body: body,
        headers: requestHeadersDefault
    };

    const request: typeof requestDefault & {
        headers: typeof requestHeadersDefault & { Authorization?: string };
    } = requestDefault;

    const canonicalHeaders = Object.keys(request.headers)
        .sort(function (a: string, b: string) {
            return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
        })
        .map(function (k: string) {
            return k.toLowerCase() + ":" + request.headers[k];
        })
        .join("\n");

    const signedHeaders = Object.keys(request.headers)
        .map(function (k: string) {
            return k.toLowerCase();
        })
        .sort()
        .join(";");

    const canonicalString = [
        request.method,
        request.path,
        "",
        canonicalHeaders,
        "",
        signedHeaders,
        hash(request.body, "hex")
    ].join("\n");

    const credentialString = [date, region, service, "aws4_request"].join("/");

    const stringToSign = ["AWS4-HMAC-SHA256", datetime, credentialString, hash(canonicalString, "hex")].join(
        "\n"
    );

    request.headers.Authorization = [
        // eslint-disable-next-line dot-notation
        "AWS4-HMAC-SHA256 Credential=" + process.env["AWS_ACCESS_KEY_ID"] + "/" + credentialString,
        "SignedHeaders=" + signedHeaders,
        "Signature=" + hmac(kSigning, stringToSign, "hex")
    ].join(", ");

    return request;
}

function hmac(key: string | Buffer, str: string): Buffer;
function hmac(key: string | Buffer, str: string, encoding: BinaryToTextEncoding): string;
function hmac(
    key: string | Buffer,
    str: string,
    encoding: BinaryToTextEncoding | undefined = undefined
): Buffer | string {
    const updatedHmac = crypto.createHmac("sha256", key).update(str, "utf8");
    if (encoding) {
        return updatedHmac.digest(encoding);
    }
    return updatedHmac.digest();
}

function hash(str: string, encoding: BinaryToTextEncoding): string {
    return crypto.createHash("sha256").update(str, "utf8").digest(encoding);
}
