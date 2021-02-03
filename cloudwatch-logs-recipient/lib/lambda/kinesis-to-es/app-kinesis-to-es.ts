const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');

import {KinesisStreamEvent, KinesisStreamRecord} from "aws-lambda";

const endpoint = process.env.ES_ENDPOINT as string;

export const handler = function(event: KinesisStreamEvent, context: any) {
    try {
        event.Records.forEach(record => handleRecord(context, record));
    } catch (e) {
        console.log('ERROR ', e);
    }
};

function handleRecord(context: any, record: KinesisStreamRecord) {
    let zippedInput = Buffer.from(record.kinesis.data, "base64");

    // decompress the input
    zlib.gunzip(zippedInput, function(error: any, buffer: any) {
        if (error) {
            context.fail(error);
            return;
        }

        // parse the input from JSON
        const awslogsData = JSON.parse(buffer.toString('utf8'));

        // transform the input to Elasticsearch documents
        const elasticsearchBulkData = transform(awslogsData);

        // skip control messages
        if (!elasticsearchBulkData) {
            console.log('Received a control message');
            context.succeed('Control message handled successfully');
            return;
        }

        postToElastic(context, awslogsData, elasticsearchBulkData);
    });
}

function postToElastic(context: any, awslogsData: any|null, elasticsearchBulkData: string) {
    // post documents to the Amazon Elasticsearch Service
    post(elasticsearchBulkData, (error: any, success: any, statusCode: any, failedItems: any) => {
        if (error) {
            console.log('Error: ' + JSON.stringify(error, null, 2));
//                console.log("Bulkdata: " + elasticsearchBulkData);

            if (failedItems && failedItems.length > 0) {
                notifyFailedItems(failedItems);

                // try repost only once
                if (awslogsData != null) {
                    const failedIds = getFailedIds(failedItems);

                    console.log("reposting, failed ids " + failedIds);

                    // some items failed, try to repost
                    const filteredBulkData = transform(awslogsData, failedIds) as string;
                    postToElastic(context, null, filteredBulkData);
                }
            } else {
                context.fail(JSON.stringify(error));
            }
        }
    });
}

function notifyFailedItems(failedItems: any[]) {
    console.log("failed items " + JSON.stringify(failedItems));
}

function getFailedIds(failedItems: any[]): string[] {
    return failedItems.map(f => f.index._id);
}

function transform(payload: any, filterIds: string[] = []): string|null {
    if (payload.messageType === 'CONTROL_MESSAGE') {
        return null;
    }

    let bulkRequestBody = '';

    payload.logEvents.filter((e: any) => !filterIds.includes(e.id))
        .forEach((logEvent: any) => {
        const timestamp = new Date(1 * logEvent.timestamp);

        // index name format: cwl-YYYY.MM
        const indexName = [
            timestamp.getUTCFullYear(),              // year
            ('0' + (timestamp.getUTCMonth() + 1)).slice(-2)  // month
        ].join('.');

        const source = buildSource(logEvent.message, logEvent.extractedFields);

        source['@id'] = logEvent.id;
        source['@timestamp'] = new Date(1 * logEvent.timestamp).toISOString();
        source['@owner'] = payload.owner;
        source['@log_group'] = payload.logGroup;
        source['@log_stream'] = payload.logStream;
        source['@transport_type'] = transportType(payload.logGroup);

        const action = { "index": {} } as any;
        //action.index._type = "base"
        action.index._id = logEvent.id;

        source['@app'] = (payload.logGroup.includes('nginx')? 'dt-nginx':payload.logGroup);

        action.index._index =  source['@app'] + "-" + indexName;

        bulkRequestBody += [
            JSON.stringify(action),
            JSON.stringify(source),
        ].join('\n') + '\n';
    });
    return bulkRequestBody;
}

function transportType(logGroup: string) {
    if(logGroup.indexOf('road') == 0) return 'road';
    if(logGroup.indexOf('marine') == 0) return 'marine';
    if(logGroup.indexOf('rail') == 0) return 'rail';

    return 'unknown';
}

function buildSource(message: string, extractedFields: any[]) {
    if (extractedFields) {
        return buildFromExtractedFields(extractedFields);
    }

    return buildFromMessage(message);
}

function buildFromMessage(message: string): any {
    message = message.replace('[, ]', '[0.0,0.0]')
//        .replace(/\"Infinity\"/g, "-1")
//        .replace(/Infinity/gi, "-1")
        .replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");

    const jsonSubString = extractJson(message);
    if (jsonSubString !== null) {
        return JSON.parse(jsonSubString);
    } else {
        try {
            return JSON.parse('{"log_line": "' + message.replace(/["']/g, "") + '"}');
        } catch (e) {
            console.info("Error converting to json:" + message);
        }
    }

    return {};
}

function buildFromExtractedFields(extractedFields: any[]): any {
    const source = {} as any;

    for (const key in extractedFields) {
        if (extractedFields.hasOwnProperty(key) && extractedFields[key]) {
            const value = extractedFields[key];

            if (isNumeric(value)) {
                source[key] = 1 * value;
                continue;
            }

            if (isInfinity(value)) {
                source[key] = -1;
                continue;
            }

            const jsonSubString = extractJson(value);
            if (jsonSubString !== null) {
                source['$' + key] = JSON.parse(jsonSubString);
            }

            source[key] = value;
        }
    }

    return source;
}

function extractJson(message: string) {
    const jsonStart = message.indexOf('{');
    if (jsonStart < 0) return null;
    const jsonSubString = message.substring(jsonStart);
    return isValidJson(jsonSubString) ? jsonSubString : null;
}

function isValidJson(message: string) {
    try {
        JSON.parse(message);
    } catch (e) { return false; }
    return true;
}

function isNumeric(n: any): boolean {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isInfinity(n: any): boolean {
    return !isNaN(parseFloat(n)) && !isFinite(n);
}

function post(body: string, callback: any) {
    const requestParams = buildRequest(endpoint, body);

    console.log("sending POST to es unCompressedSize=%d", body.length);

    const request = https.request(requestParams, function(response: any) {
        let responseBody = '';
        response.on('data', function(chunk: any) {
            responseBody += chunk;
        });
        response.on('end', function() {
            const info = JSON.parse(responseBody);
            let failedItems;
            let success;

            if (response.statusCode >= 200 && response.statusCode < 299) {
                failedItems = info.items.filter(function(x: any) {
                    return x.index.status >= 300;
                });

                success = {
                    "attemptedItems": info.items.length,
                    "successfulItems": info.items.length - failedItems.length,
                    "failedItems": failedItems.length
                };
            }

            const error = response.statusCode !== 200 || info.errors === true ? {
                "statusCode": response.statusCode,
                "responseBody": responseBody
            } : null;

            callback(error, success, response.statusCode, failedItems);
        });
    }).on('error', function(e: any) {
        callback(e);
    });
    request.end(requestParams.body);
}

function buildRequest(endpoint: string, body: string) {
    const endpointParts = endpoint.match(/^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com$/) as string[];
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
        path: '/_bulk',
        body: body,
        headers: {
            'Content-Type': 'application/json',
            'Host': endpoint,
            'Content-Length': Buffer.byteLength(body),
            'X-Amz-Security-Token': process.env.AWS_SESSION_TOKEN,
            'X-Amz-Date': datetime
        } as any
    };

    const canonicalHeaders = Object.keys(request.headers)
        .sort(function(a: string, b: string) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; })
        .map(function(k: string) { return k.toLowerCase() + ':' + request.headers[k]; })
        .join('\n');

    const signedHeaders = Object.keys(request.headers)
        .map(function(k: string) { return k.toLowerCase(); })
        .sort()
        .join(';');

    const canonicalString = [
        request.method,
        request.path, '',
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

function hmac(key: string, str: string, encoding: string = '') {
    return crypto.createHmac('sha256', key).update(str, 'utf8').digest(encoding);
}

function hash(str: string, encoding: string = '') {
    return crypto.createHash('sha256').update(str, 'utf8').digest(encoding);
}