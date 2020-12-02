import * as AWSx from "aws-sdk";
import {uploadToS3} from "../../../../common/stack/s3-utils";
const AWS = AWSx as any;
import moment from 'moment-timezone';
import * as esService from "../service/es";
import * as snsService from "../service/sns";


export const KEY_ES_ENDPOINT = 'ES_ENDPOINT'
export const KEY_S3_BUCKET_NAME = 'S3_BUCKET_NAME'
export const KEY_SNS_TOPIC_ARN = 'SNS_TOPIC_ARN'
const s3BucketName = process.env[KEY_S3_BUCKET_NAME] as string;
const esEndpoint = process.env[KEY_ES_ENDPOINT] as string;
const snsTopicArn = process.env[KEY_SNS_TOPIC_ARN] as string;
const region = process.env.AWS_REGION as string;
const index = 'road-*-daemon-*';
const path = '_search'

export const handler = async (): Promise <void> => {
    const fromISOString = moment().subtract(1, 'weeks').startOf('isoWeek').toDate().toISOString();
    const toISOString = moment().subtract(1, 'weeks').endOf('isoWeek').toDate().toISOString();

    console.info(`method=maintenanceTrackingLogWatcherHandler from ${fromISOString} to ${toISOString}`)
    const endpoint = new AWS.Endpoint(esEndpoint);

    const query = esService.getQuery(fromISOString, toISOString);

    return esService.fetchDataFromEs(
            endpoint,
            region,
            index,
            path,
            query)
        .then(async function(jsonResult) {
            const invalidJsons = esService.parseDataToString(jsonResult);
            if (invalidJsons.length > 0) {
                const fileName = `maintenanceTracking-invalid-messages-${fromISOString}-${toISOString}.log`;
                console.log(`method=maintenanceTrackingLogWatcherHandler Upload file ${fileName} to S3 Bucket  ${s3BucketName}`);
                const title = `Illegal maintenance trackings on period ${fromISOString}-${toISOString}`;
                const log = `${title}\n\n${invalidJsons}`;
                uploadToS3(s3BucketName, log, fileName);
                return await snsService.sendEmail(log, snsTopicArn);
            }
        });
};