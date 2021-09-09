import * as MaintenanceTrackingService from "../../service/maintenance-tracking";
import { SqsProducer } from 'sns-sqs-big-payload';
import {SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../constants";
import * as SqsBigPayload from "../../service/sqs-big-payload"
const sqsBucketName = process.env[SQS_BUCKET_NAME] as string;
const sqsQueueUrl = process.env[SQS_QUEUE_URL] as string;
const region = process.env.AWS_REGION as string;

const sqsProducerInstance : SqsProducer = SqsBigPayload.createSqsProducer(sqsQueueUrl, region, sqsBucketName);

export function handlerFn(sqsProducer : SqsProducer) {
    return async (apiGWRequest: any): Promise<any> => {
        const start = Date.now();
        console.info(`method=updateMaintenanceTrackingRequest bucketName=${sqsBucketName} sqsQueueUrl=${sqsQueueUrl} and region: ${region}`);
        if (!apiGWRequest || !apiGWRequest.body) {
            console.error(`method=updateMaintenanceTrackingRequest Empty message`);
            return Promise.reject(invalidRequest("Empty message"));
        }

        try {
            const messageSizeBytes = Buffer.byteLength(apiGWRequest.body);
            const messageDeduplicationId = MaintenanceTrackingService.createMaintenanceTrackingMessageHash(apiGWRequest.body);
            // console.info(`method=updateMaintenanceTrackingRequest messageDeduplicationId: ${messageDeduplicationId} sizeBytes=${messageSizeBytes}`);
            // Will send message's body to S3 if it's larger than max SQS message size
            const json = JSON.parse(apiGWRequest.body);
            await sqsProducer.sendJSON(json);
            console.info(`method=updateMaintenanceTrackingRequest sqs.sendMessage messageDeduplicationId: ${messageDeduplicationId} sizeBytes=${messageSizeBytes} count=1 tookMs=${(Date.now() - start)}`);
            return Promise.resolve(ok());
        } catch (e) {
            const end = Date.now();
            console.error(`method=updateMaintenanceTrackingRequest Error while sending message to SQS tookMs=${(end - start)}`, e);
            return Promise.reject(invalidRequest(`Error while sending message to SQS: ${e}`));
        }
    }
}

export const handler: (apiGWRequest: any) => Promise<any> = handlerFn(sqsProducerInstance);

export function invalidRequest(msg: string): object {
    return {
        statusCode: 400,
        body: `Invalid request: ${msg}`
    };
}

export function ok(): object {
    return {
        statusCode: 200,
        body: 'OK'
    };
}