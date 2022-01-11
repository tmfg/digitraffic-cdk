import {SQSEvent} from "aws-lambda";
import {SQSRecord} from "aws-lambda/trigger/sqs";
import { SqsConsumer } from 'sns-sqs-big-payload';
import * as SqsBigPayload from "../../service/sqs-big-payload";
import {MaintenanceTrackingEnvKeys} from "../../keys";
import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const middy = require('@middy/core');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure');

const sqsBucketName = process.env[MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME] as string;
const sqsQueueUrl = process.env[MaintenanceTrackingEnvKeys.SQS_QUEUE_URL] as string;
const secretId = process.env[MaintenanceTrackingEnvKeys.SECRET_ID] as string;
const region = process.env.AWS_REGION as string;

const sqsConsumerInstance : SqsConsumer = SqsBigPayload.createSqsConsumer(sqsQueueUrl, region, "processMaintenanceTrackingQueue");

export function handlerFn(sqsConsumer : SqsConsumer,
    doWithSecret: (secretId: string, fn: (secret: any) => any)
    => any) : (event: SQSEvent) => Promise<void> {
    return function(event: SQSEvent): Promise<void> {
        return doWithSecret(secretId, async () => {
            console.info(`method=processMaintenanceTrackingQueue Environment sqsBucketName: ${sqsBucketName}, sqsQueueUrl: ${sqsQueueUrl} events: ${event.Records.length} and region: ${region}`);

            return Promise.allSettled(event.Records.map(async (record: SQSRecord) => {
                try {
                    // clone event as library uses PascalCase properties -> include properties in Camel- And PascalCase
                    const clone = cloneRecordWithCamelAndPascal(record);
                    await sqsConsumer.processMessage(clone, {deleteAfterProcessing: false}); // Delete is done by S3 lifecycle
                    return Promise.resolve();
                } catch (e) {
                    console.error(`method=processMaintenanceTrackingQueue Error while handling tracking from SQS`, e);
                    return Promise.reject(e);
                }
            }));
        });
    };
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn(sqsConsumerInstance, withDbSecret)).use(sqsPartialBatchFailureMiddleware());

export function cloneRecordWithCamelAndPascal(record: any) {
    const clone : any = {};
    for (const key in record) {
        if (key in record) {
            clone[key.charAt(0).toUpperCase() + key.substring(1)] = record[key];
            clone[key.charAt(0).toLowerCase() + key.substring(1)] = record[key];
        }
    }
    return clone;
}