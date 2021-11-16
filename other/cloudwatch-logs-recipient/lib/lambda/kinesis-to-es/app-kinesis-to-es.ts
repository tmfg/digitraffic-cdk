import {
    buildFromMessage,
    extractJson, filterIds,
    getFailedIds,
    getIndexName, isControlMessage,
    isInfinity,
    isNumeric,
    parseESReturnValue
} from "./util";

const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');

import {KinesisStreamEvent, KinesisStreamRecord, CloudWatchLogsDecodedData} from "aws-lambda";
import {getAppFromSenderAccount} from "./accounts";
import {notifyFailedItems} from "./notify";

const endpoint = process.env.ES_ENDPOINT as string;
const knownAccounts = JSON.parse(process.env.KNOWN_ACCOUNTS as string);

const endpointParts = endpoint.match(/^([^.]+)\.?([^.]*)\.?([^.]*)\.amazonaws\.com$/) as string[];
const region = endpointParts[2];
const service = endpointParts[3];

const MAX_BODY_SIZE = 5000000;

export const handler = function(event: KinesisStreamEvent, context: any) {
    const statistics = {};

    try {
        let batchBody = "";

        event.Records.forEach((record: KinesisStreamRecord) => {
            const recordBody = handleRecord(record, statistics);
            batchBody += recordBody;

            if (batchBody.length > MAX_BODY_SIZE) {
                postToElastic(context, true, batchBody);
                batchBody = "";
            }
        });

        if (batchBody.length > 0) {
            postToElastic(context, true, batchBody);
        }
    } catch (e) {
        console.log('ERROR ', e);
    } finally {
        console.log("statistics " + JSON.stringify(statistics));
    }
};

function handleRecord(record: KinesisStreamRecord, statistics: any): string {
    const zippedInput = Buffer.from(record.kinesis.data, "base64");

    // decompress the input
    const ucompressed = zlib.gunzipSync(zippedInput).toString();

    // parse the input from JSON
    const awslogsData = JSON.parse(ucompressed.toString('utf8'));

    // skip control messages
    if (isControlMessage(awslogsData)) {
        console.log('Received a control message');
        return "";
    }

    return transform(awslogsData, statistics);
}

function postToElastic(context: any, retryOnFailure: boolean, elasticsearchBulkData: string) {
    // post documents to the Amazon Elasticsearch Service
    post(elasticsearchBulkData, (error: any, success: any, statusCode: any, failedItems: any) => {
        if (error) {
            console.log('Error: ' + JSON.stringify(error, null, 2));

            if (failedItems && failedItems.length > 0) {
                notifyFailedItems(failedItems);

                // try repost only once
                if (retryOnFailure) {
                    const failedIds = getFailedIds(failedItems);

                    console.log("reposting, failed ids " + failedIds);

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

function transform(payload: CloudWatchLogsDecodedData, statistics: any): string {
    let bulkRequestBody = '';

    const app = getAppFromSenderAccount(payload.owner, knownAccounts);
    const appName = getAppName(payload.logGroup, app);

    payload.logEvents.forEach((logEvent: any) => {
        const source = buildSource(logEvent.message, logEvent.extractedFields);

        source['@id'] = logEvent.id;
        source['@timestamp'] = new Date(1 * logEvent.timestamp).toISOString();
        source['@owner'] = payload.owner;
        source['@log_group'] = payload.logGroup;
        source['@log_stream'] = payload.logStream;
        source['@transport_type'] = app;
        source['@app'] = appName;

        const action = { "index": {} } as any;
        const indexName = getIndexName(appName, logEvent.timestamp);
        action.index._id = logEvent.id;
        action.index._index = indexName;

        // update statistics
        if(!statistics[indexName]) {
            statistics[indexName] = 1;
        } else {
            statistics[indexName] = statistics[indexName] + 1;
        }

        bulkRequestBody += [
            JSON.stringify(action),
            JSON.stringify(source),
        ].join('\n') + '\n';
    });
    return bulkRequestBody;
}

function getAppName(logGroup: string, app: string): string {
    if(logGroup.includes('amazonmq')) {
        return `${app}-mqtt`;
    } else if(logGroup.includes('nginx')) {
        return 'dt-nginx';
    }

    return logGroup;
}

export function buildSource(message: string, extractedFields?: any[]): any {
    if (extractedFields) {
        return buildFromExtractedFields(extractedFields);
    }

    return buildFromMessage(message, true);
}

function buildFromExtractedFields(extractedFields: any[]): any {
    const source = {} as any;

    for (const key in extractedFields) {
        if (extractedFields[key]) {
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

function post(body: string, callback: any) {
    const requestParams = buildRequest(body);

    console.log("sending POST to es unCompressedSize=%d", body.length);

    if(body.length === 0) {
        return;
    }

    const request = https.request(requestParams, function(response: any) {
        let responseBody = '';
        response.on('data', function(chunk: any) {
            responseBody += chunk;
        });
        response.on('end', function() {
            const parsedValues = parseESReturnValue(response, responseBody);

            callback(parsedValues.error, parsedValues.success, response.statusCode, parsedValues.failedItems);
        });
    }).on('error', function(e: any) {
        callback(e);
    });
    request.end(requestParams.body);
}

function buildRequest(body: string): any {
    const datetime = (new Date()).toISOString().replace(/[:-]|\.\d{3}/g, '');
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

function hmac(key: string, str: string, encoding = ''): string {
    return crypto.createHmac('sha256', key).update(str, 'utf8').digest(encoding);
}

function hash(str: string, encoding = ''): string {
    return crypto.createHash('sha256').update(str, 'utf8').digest(encoding);
}
