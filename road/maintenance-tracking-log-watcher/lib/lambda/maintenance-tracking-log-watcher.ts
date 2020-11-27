import "source-map-support/register";
import * as AWSx from "aws-sdk";
import {uploadToS3} from "../../../../common/stack/s3-utils";
const AWS = AWSx as any;
const zlib = require("zlib");
import moment from 'moment-timezone';
import {parseDataToJsonString} from "../service/es";



// import {fetchLogFromEsAndSaveToS3} from '../service/es'

export const KEY_ES_ENDPOINT = 'ES_ENDPOINT'
export const KEY_S3_BUCKET_NAME = 'S3_BUCKET_NAME'

const s3BucketName = process.env[KEY_S3_BUCKET_NAME] as string;
const esEndpoint = process.env[KEY_ES_ENDPOINT] as string;
const region = process.env.AWS_REGION as string;

export const handler = (): void => {
    const esDomain = {
        region: region,
        endpoint: esEndpoint
    };

    const start = moment().tz('Europe/Helsinki').startOf('day').toDate();
    const end = moment().tz('Europe/Helsinki').endOf('day').toDate();
    console.info("method=handlerFn at lambda")
    console.info("process.env.AWS_ACCESS_KEY_ID=" + process.env.AWS_ACCESS_KEY_ID);
    const endpoint = new AWS.Endpoint(esDomain.endpoint);

    fetchDataFromEs(
        start,
        end,
        endpoint)
};

function fetchDataFromEs(
    from: Date,
    to:  Date,
    endpoint: AWS.Endpoint) {
    const creds = new AWS.EnvironmentCredentials("AWS")
    let req = new AWS.HttpRequest(endpoint);

    const fromISOString = from.toISOString();
    const toISOString = to.toISOString();
    const index = 'road-*-daemon-*';
    const query =
`{
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "query": "logger_name:\"fi.livi.digitraffic.tie.service.v2.maintenance.V2MaintenanceTrackingUpdateService\" AND method:resolveGeometries",
            "time_zone": "Europe/Oslo"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "@timestamp": {
              "gte": "${fromISOString}",
              "lte": "${toISOString}",
              "format": "strict_date_optional_time"
            }
          }
        }
      ],
      "should": [],
      "must_not": []
    }
  }
}`;

    // req.method = "GET";
    req.method = "POST";
    req.path = `/${index}/_search`;
    req.region = region;
    req.headers["presigned-expires"] = false;
    req.headers["Host"] = endpoint.host;
    req.headers["Content-Type"] = "application/json";
    req.body = query;

    let signer = new AWS.Signers.V4(req, "es");
    signer.addAuthorization(creds, new Date());

    console.log("Sending request " + JSON.stringify(req));
    let send = new AWS.NodeHttpClient();
    send.handleRequest(
        req,
        null,
        function(httpResp: any) {
            let respBody = "";
            httpResp.on("data", function(chunk: any) {
                respBody += chunk;
            });
            httpResp.on("end", function(chunk: any) {
                console.log("Response: " + respBody);
                const invalidJsons = parseDataToJsonString(respBody);
                uploadToS3(s3BucketName, invalidJsons, `maintenanceTracking-invalid-messages-${from}-${to}.json`)
            });
        },
        function(err: any) {
            console.error("Error: " + err);
        }
    )
}
