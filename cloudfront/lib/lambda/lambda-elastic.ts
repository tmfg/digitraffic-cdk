import * as AWSx from "aws-sdk";
const AWS = AWSx as any;
import {ClientRequest, IncomingMessage, RequestOptions} from 'http';
import {Client, Connection} from '@elastic/elasticsearch';

const zlib = require('zlib');
const readline = require('readline');

const elasticDomain = process.env.ELASTIC_DOMAIN as string;
const appDomain = process.env.APP_DOMAIN as string;

const MAX_LINES_PER_MESSAGE = 4;

exports.handler = async function handler(event: any, context: any, callback: any) {
    const s3 = new AWS.S3();

    const params = {
            Bucket: event['Records'][0]['s3']['bucket']['name'],
            Key: event['Records'][0]['s3']['object']['key']
    };

    const messageBody = await handleS3Object(s3, params);
    const esMessages = createEsMessages(messageBody);

    await sendToEs(esMessages);
    //await sendToKinesis(esMessage);
}

async function handleS3Object(s3: any, params: any): Promise<string[]> {
    const s3InputStream = s3.getObject(params).createReadStream();

    const readStream = readline.createInterface({
        input: s3InputStream.pipe(zlib.createGunzip())
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
//    console.info("line: %s", line);

    // skip first two lines
    if(!line.startsWith('#')) {
        lines.push(parseLine(line));
    }
}

function createEsMessages(lines: any[]): any[] {
    const messages = new Array();
    const indexName = createIndexName();

    do {
        const linesForMessage = lines.splice(0, MAX_LINES_PER_MESSAGE);
        const action = { index: { _index: indexName, _type: 'doc' } } as any;

        linesForMessage.unshift(action);

        messages.push({
            "body": linesForMessage
        });
    } while(lines.length > 0);

    return messages;
}

async function sendToKinesis(message: any) {
    const firehose = new AWS.Firehose();

    const params = {
        DeliveryStreamName: 'cloudfront-to-elastic-stream',
        Records: [
            message.lines.map((l: string) => {Data: l})
        ]
    };

//    firehose.putRecordBatch(params, function(err, data) {
//        if(err) {
//            console.info("error occured", err, err.stack);
//        } else {
//            console.info("data", data);
//        }
//    });
}

async function sendToEs(messages: any[]) {
    for (const message of messages) {
        try {
            console.log("sending message " + JSON.stringify(message));

            const response = await sendMessageToEs(JSON.stringify(message));

            console.log("response class " + response.constructor.name);
            console.log("got response " + JSON.stringify(response));
        } catch (e) {
            console.log("got exception " + JSON.stringify(e, Object.getOwnPropertyNames(e)));
        }
    }
}

async function sendMessageToEs(message: string) {
    const endpoint = new AWS.Endpoint(elasticDomain);
    const creds = new AWS.EnvironmentCredentials("AWS")
    const req = new AWS.HttpRequest(elasticDomain);

    req.method = "POST";
    req.path = "/_bulk";
    req.region = AWS.config.region || process.env.AWS_DEFAULT_REGION;
    req.headers["presigned-expires"] = false;
    req.headers["Host"] = endpoint.host;
    req.body = message;
    req.headers["Content-Type"] = "application/json";

    console.log("unsigned request " + JSON.stringify(req));

    const signer = new AWS.Signers.V4(req, "es");
    signer.addAuthorization(creds, new Date());

    console.log("signed request " + JSON.stringify(req));

    const client = new AWS.HttpClient();
    return await client.handleRequest(
        req,
        null,
        function(httpResp: any) {
            let respBody = "";
            httpResp.on("data", function(chunk: any) {
                respBody += chunk;
            });
            httpResp.on("end", function(chunk: any) {
                console.log("Response: " + respBody);
            });
        },
        function(err: any) {
            console.log("Error: " + err);
        }
    );
}

async function sendToEsWithClient(messages: any[]) {
    const esClient = new Client({
        Connection: AwsSignedConnection,
        node: elasticDomain,
//        suggestCompression: true,
//        compression: "gzip"
    });

    for (const message of messages) {
        try {
            console.log("message " + JSON.stringify(message));

            const response = await esClient.bulk(message);

            console.log("response " + JSON.stringify(response));
        } catch (e) {
            console.log("got exception " + JSON.stringify(e, Object.getOwnPropertyNames(e)));
        }
    }
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
    const scheme = fields[16];
    const timeTaken = fields[18];
    const resultType = fields[22];
    const httpVersion = fields[23];
    const timeToFirstByte = fields[27];

    const httpDate = getHttpDate(date, time);

    return {
        '@timestamp': httpDate,
        remote_addr: ip,
        body_bytes_sent: bytes,
        http_referrer: referrer,
        http_user_agent: userAgent,
        request_method: method,
        request_time: timeTaken,
        request_uri: request,
        scheme: scheme,
        server_protocol: httpVersion,
        status: responseStatus,
        upstream_cache_status: resultType,
        edge_location: edgeLocation,
        upstream_response_time: timeToFirstByte
    };
}

function getHttpDate(date: string, time: string): string {
    return `${date}T${time}Z`;
}

class AwsSignedConnection extends Connection {
    public request(
        params: RequestOptions,
        callback: (err: Error | null, response: IncomingMessage | null) => void,
    ): ClientRequest {
        try {
            const signedParams = this.signParams(params);

            return super.request(signedParams, callback);
        } catch (e) {
            console.log("exception on request " + JSON.stringify(e, Object.getOwnPropertyNames(e)));

            throw e;
        }
    }

    private signParams(params: any): RequestOptions {
        const region = AWS.config.region || process.env.AWS_DEFAULT_REGION;
        if (!region) throw new Error('missing region configuration');
        if (!params.method) throw new Error('missing request method');
        if (!params.path) throw new Error('missing request path');
        if (!params.headers) throw new Error('missing request headers');

        const endpoint = new AWS.Endpoint(this.url.href);
        const request = new AWS.HttpRequest(endpoint, region);

        request.method = params.method;
        request.path = params.querystring
            ? `${params.path}/?${params.querystring}`
            : params.path;
        request.body = params.body as string;
        request.bulkBody = params.bulkBody;
        request.headers = params.headers;
        request.headers.Host = endpoint.host;
        request.querystring = params.querystring;
        request.timeout = params.timeout;

//        return aws4.sign(request);

        console.log("params before " + JSON.stringify(params));
        console.log("request before " + JSON.stringify(request));

        const signer = new AWS.Signers.V4(request, 'es');
        signer.addAuthorization(new AWS.EnvironmentCredentials('AWS'), new Date());

        console.log("request after " + JSON.stringify(request));

        return request;
    }
}