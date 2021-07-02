import { Context, KinesisStreamEvent, KinesisStreamRecord } from 'aws-lambda';
import {findHeaderValue} from "./logging-util";

import * as AWSx from "aws-sdk";
const AWS = AWSx as any;

const zlib = require('zlib');

const appDomain = process.env.APP_DOMAIN as string;
const application = appDomain.split('-')[0];
const env = appDomain.split('-')[1];

const elasticDomain = process.env.ELASTIC_DOMAIN as string;
const endpoint = new AWS.Endpoint(elasticDomain);
const creds = new AWS.EnvironmentCredentials("AWS")

const COMPRESS_OPTIONS = {
    level: 8,
    memLevel: 9,
    chunkSize: 1024*16*1024
};

// fields contains all the selected log fields in the order specified in loggint-utils.ts CLOUDFRONT_STREAMING_LOG_FIELDS
async function convertFieldNamesAndFormats(fields: string[]): Promise<any> {
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
    const timeTaken = fields[9];
    const httpVersion = fields[10];
    const userAgent = fields[11];
    const referrer = fields[12];
    const forwardedFor = fields[13];
    const resultType = fields[14];
    const acceptEncoding = fields[15];
    const headers = fields[16];

    const digitrafficUser = findHeaderValue('digitraffic-user', headers);
    const host = findHeaderValue('host', headers);
    const xForwardedProto = findHeaderValue('X-Forwarded-Proto', headers);

    return {
        '@timestamp': timestamp,
        '@edge_location': edgeLocation,
        '@transport_type': application,
        '@app': `${application}-cloudfront`,
        '@env': env,
        '@fields': {
            remote_addr: ip,
            body_bytes_sent: +responseBytes,
            http_referrer: referrer,
            http_user_agent: unescape(userAgent),
            request_method: requestMethod,
            request_time: +timeTaken,
            request_uri: requestUri,
            request_host: host,
            scheme: requestProtocol,
            server_protocol: httpVersion,
            status: +responseStatus,
            upstream_cache_status: resultType,
            http_x_forwarded_for: forwardedFor,
            upstream_response_time: +timeToFirstByte,
            http_digitraffic_user: digitrafficUser,
            accept_encoding: acceptEncoding,
            http_x_forwarded_proto: xForwardedProto
        }
    };
}

async function transformRecord(record: KinesisStreamRecord): Promise<any> {
    const buffer = Buffer.from(record.kinesis.data, 'base64');
    const cloudfrontRealtimeLogData: string = buffer.toString('utf8');

//    console.log('line: ' + cloudfrontRealtimeLogData);

    const logLineData = cloudfrontRealtimeLogData.trim().split('\t');

    return convertFieldNamesAndFormats(logLineData);
}

function createIndexName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    return `dt-nginx-${year}.${month}`;
}

export const handler = async (event: KinesisStreamEvent, context: Context, callback: any) => {
    try {
        const action = { index: { _index: createIndexName(), _type: '_doc' } } as any;

//        console.log('using action ' + JSON.stringify(action));

        const recordTransformPromises = event.Records.map(
            async (record: KinesisStreamRecord) => transformRecord(record));

        const data = await Promise.all(recordTransformPromises);
        const returnValue = await sendMessageToEs(createBulkMessage(action, data));

        if(returnValue.length < 200) {
            console.log("return value " + returnValue);
        }
    } catch (e) {
        console.log('exception: ' + e);
        throw e;
    }
}

function createBulkMessage(action: any, lines: any[]): string {
    let message = "";
    
    lines.forEach(line => {
        message+= JSON.stringify(action) + '\n';
        message+= JSON.stringify(line) + '\n';
    })

    message += '\n';

    return message;
}

function sendMessageToEs(message: string): Promise<any> {
    const request = new AWS.HttpRequest(endpoint);

    request.method = "POST";
    request.path = "/_bulk";
    request.region = "eu-west-1";
    request.headers["presigned-expires"] = false;
    request.headers["Host"] = endpoint.host;
    request.body = zlib.gzipSync(message, COMPRESS_OPTIONS);
    request.headers["Content-Type"] = "application/x-ndjson";
    request.headers["Content-Encoding"] = "gzip";

    const signer = new AWS.Signers.V4(request, "es");
    signer.addAuthorization(creds, new Date());

    console.log("sending POST to es unCompressedSize=%d requestSize=%d", message.length, request.body.length);

    const client = new AWS.NodeHttpClient();
    return new Promise((resolve, reject) => {
        client.handleRequest(
            request,
            null,
            function(httpResp: any) {
                let respBody = "";

                console.log("statuscode %d", httpResp.statusCode);

                httpResp.on("data", function(chunk: any) {
                    respBody += chunk;
                });
                httpResp.on("end", function(chunk: any) {
                    resolve(respBody);
                });
            },
            function(err: any) {
                console.log("Error: " + err);
                reject(new Error(err));
            });
    });
}

exports.handler = handler;
