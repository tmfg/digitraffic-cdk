const zlib = require('zlib');
const readline = require('readline');
const AWS = require('aws-sdk');
const https = require('https');
const crypto = require('crypto');

const elasticAddress = process.env.ELASTIC_ARN as string;
const AWS_REGEXP = /^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com$/;

exports.handler = async function handler(event: any, context: any, callback: any) {
    console.info(JSON.stringify(event));

    const s3 = new AWS.S3();

    const params = {
            Bucket: event['Records'][0]['s3']['bucket']['name'],
            Key: event['Records'][0]['s3']['object']['key']
    };

    const messageBody = await handleS3Object(s3, params);

    sendToEs(messageBody, function(error, success, statusCode, failedItems) {
        console.log('Response: ' + JSON.stringify({ "statusCode": statusCode }));

        if (error) {
            logFailure(error, failedItems);
            context.fail(JSON.stringify(error));
        } else {
            console.log('Success: ' + JSON.stringify(success));
            context.succeed('Success');
        }
    });
}

async function handleS3Object(s3: any, params: any): Promise<string> {
    const s3InputStream = s3.getObject(params).createReadStream();

    const readStream = readline.createInterface({
        input: s3InputStream.pipe(zlib.createGunzip())
    });

    return new Promise((resolve, reject) => {
        const esMessage = createEsMessage('test-index');
        let lines = [] as any[];

        readStream.on('line', (l: string) => handleLine(l, lines));
        readStream.on('close', () => {
            lines.unshift(esMessage);
            resolve(lines.join(''));
        });
    });
}

function handleLine(line: string, lines: any[]) {
    console.info("line: %s", line);

    // skip first two lines
    if(!line.startsWith('#')) {
        lines.push(JSON.stringify(parseLine(line)));
    }
}

function createEsMessage(indexName: string) {
    return JSON.stringify({
        "index": {
            _index: indexName
        }
    });
}

function sendToEs(messageBody: string, callback: any) {
    var requestParams = buildRequest(elasticAddress, messageBody);

    var request = https.request(requestParams, function(response) {
        var responseBody = '';
        response.on('data', function(chunk) {
            responseBody += chunk;
        });

        response.on('end', function() {
            var info = JSON.parse(responseBody);
            var failedItems;
            var success;
            var error;

            if (response.statusCode >= 200 && response.statusCode < 299) {
                failedItems = info.items.filter(function(x) {
                    return x.index.status >= 300;
                });

                success = {
                    "attemptedItems": info.items.length,
                    "successfulItems": info.items.length - failedItems.length,
                    "failedItems": failedItems.length
                };
            }

            if (response.statusCode !== 200 || info.errors === true) {
                // prevents logging of failed entries, but allows logging
                // of other errors such as access restrictions
                delete info.items;
                error = {
                    statusCode: response.statusCode,
                    responseBody: info
                };
            }

            callback(error, success, response.statusCode, failedItems);
        });
    }).on('error', function(e) {
        callback(e);
    });
    request.end(requestParams.body);
}

function buildRequest(endpoint: string, body: string) {
    const endpointParts = endpoint.match(AWS_REGEXP);
    const region = endpointParts[2];
    const service = endpointParts[3];
    const datetime = (new Date()).toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const date = datetime.substr(0, 8);
    const kDate = hmac('AWS4' + process.env.AWS_SECRET_ACCESS_KEY, date);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, 'aws4_request');

    const request = {
        host: endpoint,
        method: 'POST',
        path: '/_bulk?pipeline=mqtt_log',
        body: body,
        headers: {
            'Content-Type': 'application/json',
            'Host': endpoint,
            'Content-Length': Buffer.byteLength(body),
            'X-Amz-Security-Token': process.env.AWS_SESSION_TOKEN,
            'X-Amz-Date': datetime
        }
    };

    const canonicalHeaders = Object.keys(request.headers)
        .sort(function(a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; })
        .map(function(k) { return k.toLowerCase() + ':' + request.headers[k]; })
        .join('\n');

    const signedHeaders = Object.keys(request.headers)
        .map(function(k) { return k.toLowerCase(); })
        .sort()
        .join(';');

    const canonicalString = [
        request.method,
        '/_bulk', 'pipeline=mqtt_log',
        canonicalHeaders, '',
        signedHeaders,
        hash(request.body, 'hex'),
    ].join('\n');

    const credentialString = [ date, region, service, 'aws4_request' ].join('/');

    const stringToSign = [
        'AWS4-HMAC-SHA256',
        datetime,
        credentialString,
        hash(canonicalString, 'hex')
    ] .join('\n');

    request.headers.Authorization = [
        'AWS4-HMAC-SHA256 Credential=' + process.env.AWS_ACCESS_KEY_ID + '/' + credentialString,
        'SignedHeaders=' + signedHeaders,
        'Signature=' + hmac(kSigning, stringToSign, 'hex')
    ].join(', ');

    return request;
}

function hmac(key: string, str: string, digest: string = undefined):string {
    return crypto.createHmac('sha256', key).update(str, 'utf8').digest(digest);
}

function hash(str: string, digest: string): string {
    return crypto.createHash('sha256').update(str, 'utf8').digest(digest);
}


function parseLine(line: string) {
    const fields = line.split('\t');

    const date = fields[0];
    const time = fields[1];
    const bytes = fields[3];
    const ip = fields[4];
    const method = fields[5];
    const request = fields[7];
    const responseStatus = fields[8];
    const referrer = fields[9];
    const userAgent = fields[10];
    const timeTaken = fields[18];
    const resultType = fields[22];
    const httpVersion = fields[23];

    //HTTPDATE %{MONTHDAY}/%{MONTH}/%{YEAR}:%{TIME} %{INT}
    const httpDate = `${time}`; // TODO
    const messageLine = `${ip} - - ${httpDate} "${method} ${request} ${httpVersion}" ${responseStatus} ${bytes} ${referrer} ${userAgent} ${timeTaken} "${timeTaken}" - ${resultType}`;

    return {
        message: messageLine
    };
}