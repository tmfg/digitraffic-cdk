import {saveMaintenanceTrackingData} from "../../service/maintenance-tracking";
import {SQSEvent} from "aws-lambda";
import {SQSRecord} from "aws-lambda/trigger/sqs";
import moment from 'moment-timezone';
import {createSQSExtClient} from "../../sqs-ext";
import {SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../constants";

const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

const sqsBucketName = process.env[SQS_BUCKET_NAME] as string;
const sqsQueueUrl = process.env[SQS_QUEUE_URL] as string;

export function handlerFn(sqsClient : any) { // typeof SQSExt
    return async (event: SQSEvent) => {
        console.info(`method=processMaintenanceTrackingQueue Environment sqsBucketName: ${sqsBucketName}, sqsQueueUrl: ${sqsQueueUrl} events: ${event.Records.length}`)

        // const sqsClient = createSQSExtClient(sqsBucketName);

        let records : [];
        try {
            records = await sqsClient.transformLambdaRecords(event.Records);
        } catch (e) {
            console.error(`method=processMaintenanceTrackingQueue transformLambdaRecords failed`, e);
            return Promise.reject(e);
        }

        return Promise.allSettled(records.map(async (record: SQSRecord) => {
            try {

                const jsonString = record.body;
                // Parse JSON to get sending time
                const trackingJson = JSON.parse(jsonString);
                const sendingTime = moment(trackingJson.otsikko.lahetysaika).toDate();
                await saveMaintenanceTrackingData(jsonString, sendingTime);
                console.info(`method=processMaintenanceTrackingQueue messageSendingTime: ${sendingTime.toUTCString()} insertCount=1`);
                const deleteParams = {
                    QueueUrl: sqsQueueUrl,
                    ReceiptHandle: record.receiptHandle
                };

                try {
                    console.info('deleteMessage with params ', JSON.stringify(deleteParams));
                    await sqsClient.deleteMessage(deleteParams).promise();
                } catch (e) {
                    console.error(`method=processMaintenanceTrackingQueue Error while deleteting message from queue and S3 deleteParams: ${JSON.stringify(deleteParams)}`, e);
                    return Promise.reject(e); // This wont reject the whole processing as below will return resolve
                }

                return Promise.resolve();
            } catch (e) {
                console.error(`method=processMaintenanceTrackingQueue Error while handling tracking from SQS to db data`, e);
                return Promise.reject(e);
            }

        }));
    };
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn(createSQSExtClient(sqsBucketName))).use(sqsPartialBatchFailureMiddleware());
