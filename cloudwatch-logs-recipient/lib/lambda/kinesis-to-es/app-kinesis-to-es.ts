import {buildFromMessage, extractJson, getIndexName, isInfinity, isNumeric, parseESReturnValue} from "./util";

const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');

import {KinesisStreamEvent, KinesisStreamRecord} from "aws-lambda";
import {SNS} from "aws-sdk";
import {getAppFromSenderAccount} from "./accounts";

const endpoint = process.env.ES_ENDPOINT as string;
const topicArn = process.env.TOPIC_ARN as string;
const knownAccounts = JSON.parse(process.env.KNOWN_ACCOUNTS as string);

const endpointParts = endpoint.match(/^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com$/) as string[];
const region = endpointParts[2];
const service = endpointParts[3];

const sns = new SNS();

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

    sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify(failedItems)
    }, (err: any, data: any) => {
        if(err) {
            console.info("publish failed " + err);
        }
    });
}

function getFailedIds(failedItems: any[]): string[] {
    return failedItems.map(f => f.index._id);
}

function transform(payload: any, filterIds: string[] = []): string|null {
    if (payload.messageType === 'CONTROL_MESSAGE') {
        return null;
    }

    let bulkRequestBody = '';

    payload.logEvents.filter((e: any) => !filterIds.includes(e.id)).forEach((logEvent: any) => {
        const source = buildSource(logEvent.message, logEvent.extractedFields);
        const app = getAppFromSenderAccount(payload.owner, knownAccounts);
        const appName = getAppName(payload.logGroup, app);

        source['@id'] = logEvent.id;
        source['@timestamp'] = new Date(1 * logEvent.timestamp).toISOString();
        source['@owner'] = payload.owner;
        source['@log_group'] = payload.logGroup;
        source['@log_stream'] = payload.logStream;
        source['@transport_type'] = app;
        source['@app'] = appName;

        const action = { "index": {} } as any;
        action.index._id = logEvent.id;
        action.index._index = getIndexName(appName, logEvent.timestamp);

        bulkRequestBody += [
            JSON.stringify(action),
            JSON.stringify(source),
        ].join('\n') + '\n';
    });
    return bulkRequestBody;
}

function getAppName(logGroup: string, app: string): string {
    if(logGroup.includes('amazonmq')) return `${app}-mqtt`;
    if(logGroup.includes('nginx')) return 'dt-nginx;'

    return logGroup;
}

function buildSource(message: string, extractedFields: any[]): any {
    if (extractedFields) {
        return buildFromExtractedFields(extractedFields);
    }

    return buildFromMessage(message);
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

function post(body: string, callback: any) {
    const requestParams = buildRequest(body);

    console.log("sending POST to es unCompressedSize=%d", body.length);

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

function hmac(key: string, str: string, encoding: string = ''): string {
    return crypto.createHmac('sha256', key).update(str, 'utf8').digest(encoding);
}

function hash(str: string, encoding: string = ''): string {
    return crypto.createHash('sha256').update(str, 'utf8').digest(encoding);
}