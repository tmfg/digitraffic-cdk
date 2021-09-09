import {SQSEvent} from "aws-lambda";
import {SQSRecord} from "aws-lambda/trigger/sqs";
import { SqsConsumer } from 'sns-sqs-big-payload';
import {SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../constants";
import * as SqsBigPayload from "../../service/sqs-big-payload";

const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

const sqsBucketName = process.env[SQS_BUCKET_NAME] as string;
const sqsQueueUrl = process.env[SQS_QUEUE_URL] as string;
const region = process.env.AWS_REGION as string;


const sqsConsumerInstance : SqsConsumer = SqsBigPayload.createSqsConsumer(sqsQueueUrl, region, "processMaintenanceTrackingQueue");

export function handlerFn(sqsConsumer : SqsConsumer) {
    return async (event: SQSEvent) => {
        console.info(`method=processMaintenanceTrackingQueue Environment sqsBucketName: ${sqsBucketName}, sqsQueueUrl: ${sqsQueueUrl} events: ${event.Records.length} and region: ${region}`)

        return Promise.allSettled(event.Records.map(async (record: SQSRecord) => {
            try {
                // clone event as library uses PascalCase properties -> include properties in Camel- And PascalCase
                const clone = cloneRecordWithCamelAndPascal(record);
                const value = await sqsConsumer.processMessage(clone, {deleteAfterProcessing: false}); // Delete is done by S3 lifecycle
                console.debug("value: " + value);
                return Promise.resolve();
            } catch (e) {
                console.error(`method=processMaintenanceTrackingQueue Error while handling tracking from SQS`, e);
                return Promise.reject(e);
            }
        }));
    }
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn(sqsConsumerInstance)).use(sqsPartialBatchFailureMiddleware());

export interface Havainto {
    readonly havainto: {
        readonly tyokone: {
            readonly id: number;
        },
        readonly urakkaid: number,
        readonly havaintoaika: string;
    }
}

export function cloneRecordWithCamelAndPascal(record: any) {
    const clone : any = {};
    for (const key in record) {
        if (record.hasOwnProperty(key)) {
            clone[key.charAt(0).toUpperCase() + key.substring(1)] = record[key];
            clone[key.charAt(0).toLowerCase() + key.substring(1)] = record[key];
        }
    }
    return clone;
}