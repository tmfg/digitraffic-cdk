import type { KinesisStreamEvent, KinesisStreamRecord } from "aws-lambda";
import { findHeaderValue } from "./logging-util.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

import AWS, { type EnvironmentCredentials, type HttpRequest } from "aws-sdk";
import type { IncomingMessage } from "http";
import * as zlib from "zlib";

// camels

// eslint-disable-next-line dot-notation, @typescript-eslint/non-nullable-type-assertion-style
const appDomain = process.env["APP_DOMAIN"] as string;
const application = appDomain.split("-")[0];
const env = appDomain.split("-")[1];

// eslint-disable-next-line dot-notation, @typescript-eslint/non-nullable-type-assertion-style
const elasticDomain = process.env["ELASTIC_DOMAIN"] as string;
const endpoint = new AWS.Endpoint(elasticDomain);
const creds = new AWS.EnvironmentCredentials("AWS");

const COMPRESS_OPTIONS = {
    level: 8,
    memLevel: 9,
    chunkSize: 1024 * 16 * 1024
};

// fields contains all the selected log fields in the order specified in loggint-utils.ts CLOUDFRONT_STREAMING_LOG_FIELDS
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function convertFieldNamesAndFormats(fields: string[]) {
    // field order comes from documentation https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/real-time-logs.html#understand-real-time-log-config-fields
    const timestamp = new Date(1000 * Number(fields[0])).toISOString();
    const ip = fields[1];
    const timeToFirstByte = fields[2];
    const responseStatus = fields[3];
    const responseBytes = fields[4];
    const requestMethod = fields[5];
    const requestProtocol = fields[6];
    const requestUri = fields[7];
    const edgeLocation = fields[8];
    const edgeRequestId = fields[9];
    const timeTaken = fields[10];
    const httpVersion = fields[11];
    const userAgent = fields[12];
    const referrer = fields[13];
    const forwardedFor = fields[14];
    const resultType = fields[15];
    const acceptEncoding = fields[16];
    const headers = fields[17];

    const digitrafficUser = findHeaderValue("digitraffic-user", headers);
    const host = findHeaderValue("host", headers);
    const xForwardedProto = findHeaderValue("X-Forwarded-Proto", headers);

    return {
        "@timestamp": timestamp,
        "@edge_request_id": edgeRequestId,
        "@edge_location": edgeLocation,
        "@transport_type": application,
        "@app": `${application}-cloudfront`,
        "@env": env,
        "@fields": {
            remote_addr: ip,
            body_bytes_sent: responseBytes ? +responseBytes : responseBytes,
            http_referrer: referrer,
            http_user_agent: userAgent ? unescape(userAgent) : userAgent,
            request_method: requestMethod,
            request_time: timeTaken ? +timeTaken : timeTaken,
            request_uri: requestUri,
            request_host: host,
            scheme: requestProtocol,
            server_protocol: httpVersion,
            status: responseStatus ? +responseStatus : responseStatus,
            upstream_cache_status: resultType,
            http_x_forwarded_for: forwardedFor,
            upstream_response_time: timeToFirstByte ? +timeToFirstByte : timeToFirstByte,
            http_digitraffic_user: digitrafficUser,
            accept_encoding: acceptEncoding,
            http_x_forwarded_proto: xForwardedProto
        }
    };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function transformRecord(record: KinesisStreamRecord) {
    const buffer = Buffer.from(record.kinesis.data, "base64");
    const cloudfrontRealtimeLogData: string = buffer.toString("utf8");

    //    console.log('line: ' + cloudfrontRealtimeLogData);

    const logLineData = cloudfrontRealtimeLogData.trim().split("\t");

    return convertFieldNamesAndFormats(logLineData);
}

function createIndexName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `dt-nginx-${year}.${month}`;
}

export const handler = async (event: KinesisStreamEvent) => {
    try {
        const action = {
            index: { _index: createIndexName(), _type: "_doc" }
        };

        //        console.log('using action ' + JSON.stringify(action));

        const data = event.Records.map((record: KinesisStreamRecord) => transformRecord(record));

        const returnValue = await sendMessageToEs(createBulkMessage(action, data));

        if (returnValue.length < 200) {
            logger.info({
                method: "lambda-stream-to-elastic.handler",
                message: "return value " + returnValue
            });
        }
    } catch (e_) {
        const e = e_ as Error;
        logger.error({
            message: "exception: " + e.message,
            method: "lambda-stream-to-elastic.handler",
            error: e
        });
        throw e;
    }
};

function createBulkMessage(action: unknown, lines: unknown[]): string {
    let message = "";

    lines.forEach((line) => {
        message += JSON.stringify(action) + "\n";
        message += JSON.stringify(line) + "\n";
    });

    message += "\n";

    return message;
}

// Signers API as well as NodeHttpClient are part of private API in AWS SDK v2.
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace AWS {
        // eslint-disable-next-line @typescript-eslint/no-namespace
        namespace Signers {
            class V4 {
                constructor(request: AWS.HttpRequest, serviceName: string, options?: object);
                addAuthorization(creds: EnvironmentCredentials, date: Date): void;
            }
        }
        class NodeHttpClient {
            // eslint-disable-next-line @typescript-eslint/ban-types,@rushstack/no-new-null
            handleRequest(
                req: HttpRequest,
                options: object | null,
                // eslint-disable-next-line @typescript-eslint/ban-types
                callback: Function,
                // eslint-disable-next-line @typescript-eslint/ban-types
                errCallback: Function
            ): void;
        }
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function sendMessageToEs(message: string): Promise<string> {
    const request = new AWS.HttpRequest(endpoint, "eu-west-1");

    request.method = "POST";
    request.path = "/_bulk";
    request.headers["presigned-expires"] = "false";
    // eslint-disable-next-line dot-notation
    request.headers["Host"] = endpoint.host;
    request.body = zlib.gzipSync(message, COMPRESS_OPTIONS);
    request.headers["Content-Type"] = "application/x-ndjson";
    request.headers["Content-Encoding"] = "gzip";

    const signer = new AWS.Signers.V4(request, "es");
    signer.addAuthorization(creds, new Date());

    logger.info({
        message: `sending POST to es unCompressedSize=${message.length} requestSize=${request.body.length}`,
        method: "lambda-stream-to-elastic.sendMessageToEs"
    });

    const client = new AWS.NodeHttpClient();
    return new Promise((resolve, reject) => {
        client.handleRequest(
            request,
            null,
            function (httpResp: IncomingMessage) {
                let respBody = "";

                logger.info({
                    message: `statuscode ${httpResp.statusCode}`,
                    method: "lambda-stream-to-elastic.sendMessageToEs"
                });

                httpResp.on("data", function (chunk: string) {
                    respBody += chunk;
                });
                httpResp.on("end", function (chunk: string) {
                    resolve(respBody);
                });
            },
            function (err: string) {
                logger.error({
                    message: "Error: " + err,
                    method: "lambda-stream-to-elastic.sendMessageToEs"
                });
                reject(new Error(err));
            }
        );
    });
}
