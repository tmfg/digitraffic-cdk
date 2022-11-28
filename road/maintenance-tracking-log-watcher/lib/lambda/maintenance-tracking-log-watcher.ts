import * as AWSx from "aws-sdk";
import {uploadToS3} from "@digitraffic/common/dist/aws/runtime/s3";
import moment from 'moment-timezone';
import * as esService from "../service/es";
import * as snsService from "../service/sns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AWS = AWSx as any;

export const KEY_ES_ENDPOINT = 'ES_ENDPOINT';
export const KEY_S3_BUCKET_NAME = 'S3_BUCKET_NAME';
export const KEY_SNS_TOPIC_ARN = 'SNS_TOPIC_ARN';
const s3BucketName = process.env[KEY_S3_BUCKET_NAME] as string;
const esEndpoint = process.env[KEY_ES_ENDPOINT] as string;
const snsTopicArn = process.env[KEY_SNS_TOPIC_ARN] as string;
const region = process.env.AWS_REGION as string;
const index = 'road-*-daemon-*';
const path = '_search';

export const handler = async (): Promise <void> => {
    const fromISOString = moment().subtract(1, 'weeks').startOf('isoWeek').toDate().toISOString();
    const toISOString = moment().subtract(1, 'weeks').endOf('isoWeek').toDate().toISOString();
    console.info(`method=maintenanceTrackingLogWatcherHandler start from ${fromISOString} to ${toISOString}`);

    const start = Date.now();

    try {
        const endpoint = new AWS.Endpoint(esEndpoint);
        await esService.fetchAndParseDataFromEs(
            endpoint,
            region,
            index,
            path,
            fromISOString,
            toISOString,
        ).then(async function(resultLogLines) {
            if (resultLogLines.length > 0) {
                const fileName = `maintenanceTracking-invalid-messages-${fromISOString}-${toISOString}.log`;
                console.info(`method=maintenanceTrackingLogWatcherHandler Upload file ${fileName} to S3 Bucket  ${s3BucketName}`);
                const title = `Illegal maintenance trackings on period ${fromISOString}-${toISOString}`;
                const log = `${title}\n\n${resultLogLines}`;
                await uploadToS3(s3BucketName, log, fileName);
                await snsService.sendEmail(log, snsTopicArn);
            }
        });
    } catch (error) {
        console.error(`method=maintenanceTrackingLogWatcherHandler Error in execution from ${fromISOString} to ${toISOString} error=${error}`);
        return Promise.reject(error);
    } finally {
        console.info(`method=maintenanceTrackingLogWatcherHandler from ${fromISOString} to ${toISOString} tookMs=${(Date.now()-start)}`);
    }
};