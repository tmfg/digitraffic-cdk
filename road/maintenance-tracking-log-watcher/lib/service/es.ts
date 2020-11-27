// // const AWS = require('aws-sdk');
// // import * as AWSx from 'aws-sdk';
// // import {Endpoint, HttpRequest, Signer, Credentials, HttpClient} from 'aws-sdk';
// import * as AWSx from 'aws-sdk';
// import nodeFetch from 'node-fetch';
// import {uploadToS3} from "../../../../common/stack/s3-utils";
// const AWS = AWSx as any;
// // const AWS = AWSx as any;
// const https = require("https");
//
//
// const agent = new https.Agent({
//     rejectUnauthorized: false
// });
//
//
// /**
//  * Parse json messages from ES response to JSON string
//  * @param esRawDataJson
//  */
// function parseDataToJsonString(esRawDataJson : string): string {
//     let es = JSON.parse(esRawDataJson);
//
//     let hits = es.rawResponse.hits.hits;
//
//     const existing = new Set();
//     const jsons: string[] = [];
//     hits.map( function(hit : any) {
//         // console.log(_source.message)
//         const message = hit.message;
//         const start = message.substring(message.indexOf('JSON:') + 5);
//         const jsonContent = start.substring(0, start.lastIndexOf('}') + 1);
//         const tracking = JSON.parse(jsonContent);
//
//         const formattedJson = JSON.stringify(tracking, null, 2);
//         if (!existing.has(formattedJson)) {
//             console.log("");
//             console.log(formattedJson)
//             console.log("");
//             existing.add(formattedJson);
//             jsons.push(formattedJson);
//         }
//     });
//
//     return JSON.stringify(jsons);
// }
//
//
// function fetchDataFromEs(esUrl : string, from: Date, to:  Date, region : string, accessKeyId : string, secretAccessKey : string) : string {
//     // Promise<string> {
//
//     const fromISOString = from.toISOString();
//     const toISOString = to.toISOString();
//     const query = "method:resolveGeometries";
//     // esUrl: 'https://search-dt-elasticsearch-domain-iop643hm4otjjxynfimjcs6ktu.eu-west-1.es.amazonaws.com/_plugin/kibana/internal/search/es',
//     var domain = 'search-dt-elasticsearch-domain-iop643hm4otjjxynfimjcs6ktu.eu-west-1.es.amazonaws.com'; // e.g. search-domain.region.es.amazonaws.com
//     var index = 'road-*-daemon-*';
//     var type = '_doc';
//     var id = '1';
//     var json = {
//         "title": "Moneyball",
//         "director": "Bennett Miller",
//         "year": "2011"
//     }
//
//     var endpoint = new AWS.Endpoint(domain);
//     var request = new AWS.HttpRequest(endpoint, region);
//
//     request.method = 'GET';
//     request.path += index + '/' + type + '/' + id;
//     request.body = "{\"params\":{\"preference\":1605010523610,\"index\":\"road-*-daemon-*\",\"body\":{\"version\":true,\"size\":500,\"sort\":[{\"@timestamp\":{\"order\":\"desc\",\"unmapped_type\":\"boolean\"}}],\"aggs\":{\"2\":{\"date_histogram\":{\"field\":\"@timestamp\",\"fixed_interval\":\"30m\",\"time_zone\":\"Europe/Oslo\",\"min_doc_count\":1}}},\"stored_fields\":[\"*\"],\"script_fields\":{},\"docvalue_fields\":[{\"field\":\"@timestamp\",\"format\":\"date_time\"},{\"field\":\"fromPublicityStartTime\",\"format\":\"date_time\"},{\"field\":\"imageTimestamp\",\"format\":\"date_time\"},{\"field\":\"importTime\",\"format\":\"date_time\"},{\"field\":\"lastModified\",\"format\":\"date_time\"},{\"field\":\"messageTimestamp\",\"format\":\"date_time\"},{\"field\":\"previousTimestamp\",\"format\":\"date_time\"},{\"field\":\"toPublicityStartTime\",\"format\":\"date_time\"}],\"_source\":{\"excludes\":[]},\"query\":{\"bool\":{\"must\":[{\"query_string\":{\"query\":\"method:resolveGeometries\",\"analyze_wildcard\":true,\"time_zone\":\"Europe/Oslo\"}}],\"filter\":[{\"range\":{\"@timestamp\":{\"gte\":\"" + fromISOString + "\",\"lte\":\"" + toISOString + "\",\"format\":\"strict_date_optional_time\"}}}],\"should\":[],\"must_not\":[]}},\"highlight\":{\"pre_tags\":[\"@kibana-highlighted-field@\"],\"post_tags\":[\"@/kibana-highlighted-field@\"],\"fields\":{\"*\":{}},\"fragment_size\":2147483647}},\"rest_total_hits_as_int\":true,\"ignore_unavailable\":true,\"ignore_throttled\":true,\"timeout\":\"60000ms\"},\"serverStrategy\":\"es\"}";
//     request.headers['host'] = domain;
//     request.headers['Content-Type'] = 'application/json';
//     // Content-Length is only needed for DELETE requests that include a request
//     // body, but including it for all requests doesn't seem to hurt anything.
//     request.headers['Content-Length'] = Buffer.byteLength(request.body);
//
//     const credentials = new AWS.Credentials(accessKeyId, secretAccessKey);
//     const signer = AWS.Signers.V4(request, 'es');
//     signer.addAuthorization(credentials, new Date());
//     // const signer = new Signer({
//     //     endpoint,
//     //     region,
//     //     accessKeyId,
//     //     secretAccessKey,
//     //     signatureVersion: 'v4',
//     //     apiVersion: '2017-08-25',
//     //     sslEnabled: true
//     // });
//
//
//     // var client = new HttpClient();
//     var client = new AWS.HttpClient();
//     client.handleRequest(request, null, function(response : any) {
//         console.log(response.statusCode + ' ' + response.statusMessage);
//         var responseBody = '';
//         response.on('data', function (chunk : any) {
//             responseBody += chunk;
//         });
//         response.on('end', function (chunk : any) {
//             console.log('Response body: ' + responseBody);
//             return responseBody;
//         });
//     }, function(error : any) {
//         console.log('Error: ' + error);
//     });
//
//     return '';
//     //
//     // const response = await nodeFetch(esUrl, {
//     //     "headers": {
//     //         "accept": "*/*",
//     //         "accept-language": "fi,en-US;q=0.9,en-GB;q=0.8,en;q=0.7,nb;q=0.6,no;q=0.5,da;q=0.4,sv;q=0.3",
//     //         "cache-control": "no-cache",
//     //         "content-type": "application/json",
//     //         "kbn-version": "7.7.0",
//     //         "pragma": "no-cache",
//     //         "sec-fetch-dest": "empty",
//     //         "sec-fetch-mode": "cors",
//     //         "sec-fetch-site": "same-origin",
//     //         "cookie": "_ga=GA1.2.1392364353.1566390161; _gid=GA1.2.868761786.1604919336",
//     //         "referrer": "https://kibana.digitraffic.fi/_plugin/kibana/app/kibana",
//     //         "referrerPolicy": "strict-origin-when-cross-origin",
//     //     },
//     //     "body": "{\"params\":{\"preference\":1605010523610,\"index\":\"road-*-daemon-*\",\"body\":{\"version\":true,\"size\":500,\"sort\":[{\"@timestamp\":{\"order\":\"desc\",\"unmapped_type\":\"boolean\"}}],\"aggs\":{\"2\":{\"date_histogram\":{\"field\":\"@timestamp\",\"fixed_interval\":\"30m\",\"time_zone\":\"Europe/Oslo\",\"min_doc_count\":1}}},\"stored_fields\":[\"*\"],\"script_fields\":{},\"docvalue_fields\":[{\"field\":\"@timestamp\",\"format\":\"date_time\"},{\"field\":\"fromPublicityStartTime\",\"format\":\"date_time\"},{\"field\":\"imageTimestamp\",\"format\":\"date_time\"},{\"field\":\"importTime\",\"format\":\"date_time\"},{\"field\":\"lastModified\",\"format\":\"date_time\"},{\"field\":\"messageTimestamp\",\"format\":\"date_time\"},{\"field\":\"previousTimestamp\",\"format\":\"date_time\"},{\"field\":\"toPublicityStartTime\",\"format\":\"date_time\"}],\"_source\":{\"excludes\":[]},\"query\":{\"bool\":{\"must\":[{\"query_string\":{\"query\":\"method:resolveGeometries\",\"analyze_wildcard\":true,\"time_zone\":\"Europe/Oslo\"}}],\"filter\":[{\"range\":{\"@timestamp\":{\"gte\":\"" + fromISOString + "\",\"lte\":\"" + toISOString + "\",\"format\":\"strict_date_optional_time\"}}}],\"should\":[],\"must_not\":[]}},\"highlight\":{\"pre_tags\":[\"@kibana-highlighted-field@\"],\"post_tags\":[\"@/kibana-highlighted-field@\"],\"fields\":{\"*\":{}},\"fragment_size\":2147483647}},\"rest_total_hits_as_int\":true,\"ignore_unavailable\":true,\"ignore_throttled\":true,\"timeout\":\"60000ms\"},\"serverStrategy\":\"es\"}",
//     //     "method": "POST",
//     //     "agent": agent
//     // });
//     // return await response.text();
// }
//
// export async function fetchLogFromEsAndSaveToS3(esUrl: string, from: Date, to:  Date, bucketName: string, region : string, accessKeyId : string, secretAccessKey : string): Promise<any | undefined> {
//     console.info(`method=fetchLogFromEsAndSaveToS3 esURl: ${esUrl} from: ${from} to: ${to} bucketName: ${bucketName}`);
//     const ip : string = await getMyIp();
//     console.info(`method=fetchLogFromEsAndSaveToS3 ip: ${ip}`);
//     const rawJson = await fetchDataFromEs(esUrl, from, to, region, accessKeyId, secretAccessKey);
//     console.info(`method=fetchLogFromEsAndSaveToS3 rawJson: ${rawJson}`);
//     console.info(`method=fetchLogFromEsAndSaveToS3 parseDataToJsonString`)
//     const invalidJsons : string = parseDataToJsonString(rawJson);
//     console.info(`method=fetchLogFromEsAndSaveToS3 invalidJsons: ${invalidJsons}`);
//     console.info(`method=fetchLogFromEsAndSaveToS3 uploadToS3`)
//     return uploadToS3(bucketName, invalidJsons, `maintenanceTracking-invalid-messages-${from}-${to}.json`)
// }
//
// async function getMyIp() : Promise<string> {
//     const response = await nodeFetch('https://ifconfig.me/ip');
//     return await response.text();
// }
//
//
