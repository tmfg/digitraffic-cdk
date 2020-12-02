import * as AWSx from "aws-sdk";
import {uploadToS3} from "../../../../common/stack/s3-utils";
const AWS = AWSx as any;
import moment from 'moment-timezone';
import * as es from "../service/es";

export const KEY_ES_ENDPOINT = 'ES_ENDPOINT'
export const KEY_S3_BUCKET_NAME = 'S3_BUCKET_NAME'
const s3BucketName = process.env[KEY_S3_BUCKET_NAME] as string;
const esEndpoint = process.env[KEY_ES_ENDPOINT] as string;
const region = process.env.AWS_REGION as string;
const index = 'road-*-daemon-*';
const path = '_search'

export const handler = async (): Promise <void> => {
    const yesterday = moment().add('days', -1);
    const from = yesterday.startOf('day').toDate();
    const to = yesterday.endOf('day').toDate();

    const endpoint = new AWS.Endpoint(esEndpoint);

    const fromISOString = from.toISOString();
    const toISOString = to.toISOString();
    const query = es.getQuery(fromISOString, toISOString);

    return es.fetchDataFromEs(
            endpoint,
            region,
            index,
            path,
            query)
        .then(function(jsonResult) {
            console.log(`Result `, JSON.stringify(jsonResult).substring(0,1000));
            const invalidJsons = es.parseDataToString(jsonResult);
            if (invalidJsons.length > 0) {
                const fileName = `maintenanceTracking-invalid-messages-${fromISOString}-${toISOString}.log`;
                console.log(`Upload file ${fileName} to S3 Bucket  ${s3BucketName}`);
                uploadToS3(s3BucketName, invalidJsons, fileName);
            }
        });
};