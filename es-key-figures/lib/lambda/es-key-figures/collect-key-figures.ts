import {IncomingMessage} from "http";

var https = require('https');
var zlib = require('zlib');
var crypto = require('crypto');

const {endpoint} = process.env;

export const handler = async (): Promise<string> => {
  return 'abc';
};

function post(body: string, callback: any) {
  var requestParams = buildPostRequest(endpoint as string, body);

  var request = https.request(requestParams, function (response: IncomingMessage) {
    var responseBody = '';
    response.on('data', function (chunk) {
      responseBody += chunk;
    });
    response.on('end', function () {
      var info = JSON.parse(responseBody);
      var failedItems;
      var success;

      // @ts-ignore
      if (response.statusCode >= 200 && response.statusCode < 299) {
        failedItems = info.items.filter(function (x: any) {
          return x.index.status >= 300;
        });

        success = {
          "attemptedItems": info.items.length,
          "successfulItems": info.items.length - failedItems.length,
          "failedItems": failedItems.length
        };
      }

      var error = response.statusCode !== 200 || info.errors === true ? {
        "statusCode": response.statusCode,
        "responseBody": responseBody
      } : null;

      callback(error, success, response.statusCode, failedItems);
    });
  }).on('error', function (e: Error) {
    callback(e);
  });
  request.end(requestParams.body);
}

function buildPostRequest(endpoint: string, body: string) {
  var endpointParts = endpoint.match(/^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com$/) as string[];
  var region = endpointParts[2];
  var service = endpointParts[3];
  var datetime = (new Date()).toISOString().replace(/[:\-]|\.\d{3}/g, '');
  var date = datetime.substr(0, 8);
  var kDate = hmac('AWS4' + process.env.AWS_SECRET_ACCESS_KEY, date);
  var kRegion = hmac(kDate, region);
  var kService = hmac(kRegion, service);
  var kSigning = hmac(kService, 'aws4_request');

  var request = {
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
    }
  };

  var canonicalHeaders = Object.keys(request.headers)
    .sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    })

    .map(function (k) {
      // @ts-ignore
      return k.toLowerCase() + ':' + request.headers[k];
    })
    .join('\n');

  var signedHeaders = Object.keys(request.headers)
    .map(function (k) {
      return k.toLowerCase();
    })
    .sort()
    .join(';');

  var canonicalString = [
    request.method,
    request.path, '',
    canonicalHeaders, '',
    signedHeaders,
    hash(request.body, 'hex'),
  ].join('\n');

  var credentialString = [date, region, service, 'aws4_request'].join('/');

  var stringToSign = [
    'AWS4-HMAC-SHA256',
    datetime,
    credentialString,
    hash(canonicalString, 'hex')
  ].join('\n');

  // @ts-ignore
  request.headers.Authorization = [
    'AWS4-HMAC-SHA256 Credential=' + process.env.AWS_ACCESS_KEY_ID + '/' + credentialString,
    'SignedHeaders=' + signedHeaders,
    'Signature=' + hmac(kSigning, stringToSign, 'hex')
  ].join(', ');

  return request;
}

function hmac(key: string, str: string, encoding?: string) {
  return crypto.createHmac('sha256', key).update(str, 'utf8').digest(encoding);
}

function hash(str: string, encoding: string) {
  return crypto.createHash('sha256').update(str, 'utf8').digest(encoding);
}
