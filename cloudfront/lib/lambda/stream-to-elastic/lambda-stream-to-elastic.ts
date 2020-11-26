import { Context, KinesisStreamEvent, KinesisStreamRecord } from 'aws-lambda';
import {findHeaderValue} from "./logging-util";

import * as AWSx from "aws-sdk";
const AWS = AWSx as any;

const zlib = require('zlib');

const elasticDomain = process.env.ELASTIC_DOMAIN as string;
const appDomain = process.env.APP_DOMAIN as string;
const endpoint = new AWS.Endpoint(elasticDomain);
const creds = new AWS.EnvironmentCredentials("AWS")

const COMPRESS_OPTIONS = {
    level: 8,
    memLevel: 9,
    chunkSize: 1024*16*1024
};

async function convertFieldNamesAndFormats(fields: string[]): Promise<any> {
    const timestamp = new Date(1000 * Number(fields[0])).toISOString();
    const ip = fields[1];
    const timeToFirstByte = fields[2];
    const responseStatus = fields[3];
    const responseBytes = fields[4];
    const requestMethod = fields[5];
    const scheme = fields[6];
    const request = fields[7];
    const edgeLocation = fields[8];
    const serverName = fields[9];
    const timeTaken = fields[10];
    const httpVersion = fields[11];
    const userAgent = unescape(fields[12]);
    const referrer = fields[13];
    const forwardedFor = fields[14];
    const resultType = fields[15];
    const digitrafficUser = findHeaderValue('digitraffic-user', fields[16]);

    return {
        '@timestamp': timestamp,
        remote_addr: ip,
        body_bytes_sent: +responseBytes,
        http_referrer: referrer,
        http_user_agent: userAgent,
        request_method: requestMethod,
        request_time: +timeTaken,
        request_uri: request,
        request_host: serverName,
        scheme: scheme,
        server_protocol: httpVersion,
        status: +responseStatus,
        upstream_cache_status: resultType,
        edge_location: edgeLocation,
        forwarded_for: forwardedFor,
        upstream_response_time: +timeToFirstByte,
        http_digitraffic_user: digitrafficUser
    };
}

async function transformRecord(record: KinesisStreamRecord): Promise<any> {
    const buffer = Buffer.from(record.kinesis.data, 'base64');
    const cloudfrontRealtimeLogData: string = buffer.toString('utf8');
    const logLineData = cloudfrontRealtimeLogData.trim().split('\t');

    return await convertFieldNamesAndFormats(logLineData);
}

function createIndexName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    return `${appDomain}-cf-${year}.${month}`;
}

export const handler = async (event: KinesisStreamEvent, context: Context, callback: any) => {
    try {
        const action = { index: { _index: createIndexName(), _type: 'doc' } } as any;

        const recordTransformPromises = event.Records.map(
            async (record: KinesisStreamRecord) => await transformRecord(record));

        const data = await Promise.all(recordTransformPromises);
        const returnValue = await sendMessageToEs(createBulkMessage(action, data));

        if(returnValue.length < 1000) {
            console.log("return value " + returnValue);
        }
    } catch (e) {
        console.log('cloudfront_realtimelog_log_to_es: ' + e);
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
