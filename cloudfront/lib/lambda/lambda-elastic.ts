import "source-map-support/register";
import * as AWSx from "aws-sdk";
const AWS = AWSx as any;

const pLimit = require('p-limit');
const zlib = require('zlib');
const readline = require('readline');

const elasticDomain = process.env.ELASTIC_DOMAIN as string;
const appDomain = process.env.APP_DOMAIN as string;
const endpoint = new AWS.Endpoint(elasticDomain);
const creds = new AWS.EnvironmentCredentials("AWS")
const s3 = new AWS.S3();

const MAX_LINES_PER_MESSAGE = 6000;

const VERSION_HEADERS = "EXT_VERSION";

const COMPRESS_OPTIONS = {
    level: 8,
    memLevel: 9,
    chunkSize: 1024*16*1024
};

exports.handler = async function handler(event: any, context: any, callback: any) {
    const params = {
            Bucket: event.Records[0].s3.bucket.name,
            Key: event.Records[0].s3.object.key
    };

    const accessLogLines = await handleS3Object(s3, params);

    console.log("access_log read from s3 logLinesCount=%d", accessLogLines.length);

    const esMessages = createEsMessages(accessLogLines);

    console.log("es messages created messageCount=%d", esMessages.length);

    await sendToEs(esMessages);
}

async function handleS3Object(s3: any, params: any): Promise<any[]> {
    const s3InputStream = s3.getObject(params).createReadStream();

    const readStream = readline.createInterface({
        input: s3InputStream.pipe(zlib.createGunzip(COMPRESS_OPTIONS))
    });

    return new Promise((resolve, reject) => {
        let lines = [] as any[];

        readStream.on('line', (l: string) => handleLine(l, lines));
        readStream.on('close', () => {
            resolve(lines);
        });
    });
}

function createIndexName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return `${appDomain}-cf-${year}.${month}`;
}

function handleLine(line: string, lines: any[]) {
    // skip first two lines
    if(!line.startsWith('#')) {
        lines.push(parseLine(line));
    }
}

function createEsMessages(lines: any[]): string[] {
    const messages = new Array();
    const indexName = createIndexName();
    const action = { index: { _index: indexName, _type: 'doc' } } as any;

    do {
        const linesForMessage = lines.splice(0, MAX_LINES_PER_MESSAGE);

        messages.push(createBulkMessage(action, linesForMessage));
    } while(lines.length > 0);

    return messages;
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

async function sendToEs(messages: any[]) {
    // limit concurrency to 4 with p-limit
    const limit = pLimit(4);
    const results = await Promise.all(messages.map(message => limit(() => sendMessageToEs(message))));

    results.forEach(logResponse);
}

function logResponse(response: any) {
    try {
        const json = JSON.parse(response);

        if(json.errors) {
            console.log("errors tookMs=%d errors=%d", json.took, json.errors);
            console.log("response " + response);
        } else {
            console.log("succesful tookMs=%d", json.took);
        }
    } catch(e) {
        console.log("got exception " + e);
    }
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

function parseLine(line: string): any {
    const fields = line.split('\t');

    const date = fields[0];
    const time = fields[1];
    const edgeLocation = fields[2];
    const bytes = fields[3];
    const ip = fields[4];
    const method = fields[5];
    const request = fields[7];
    const responseStatus = fields[8];
    const referrer = fields[9];
    const userAgent = unescape(fields[10]);
    const cHostHeader = fields[15];
    const scheme = fields[16];
    const timeTaken = fields[18];
    const resultType = fields[22];
    const httpVersion = fields[23];
    const timeToFirstByte = fields[27];

    const httpDate = getHttpDate(date, time);

    return {
        '@timestamp': httpDate,
        remote_addr: ip,
        body_bytes_sent: +bytes,
        http_referrer: referrer,
        http_user_agent: userAgent,
        request_method: method,
        request_time: +timeTaken,
        request_uri: request,
        request_host: cHostHeader,
        scheme: scheme,
        server_protocol: httpVersion,
        status: +responseStatus,
        upstream_cache_status: resultType,
        edge_location: edgeLocation,
        upstream_response_time: +timeToFirstByte
    };
}

function getHttpDate(date: string, time: string): string {
    return `${date}T${time}Z`;
}