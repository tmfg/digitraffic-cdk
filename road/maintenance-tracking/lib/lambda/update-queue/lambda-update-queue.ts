import * as MaintenanceTrackingService from "../../service/maintenance-tracking";
import * as SqsExt from "../../sqs-ext";
import {SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../constants";
import aws from 'aws-sdk';
import {SendMessageRequest} from "aws-sdk/clients/sqs";

const sqsBucketName = process.env[SQS_BUCKET_NAME] as string;
const sqsQueueUrl = process.env[SQS_QUEUE_URL] as string;

export function handlerFn(sqsClient : aws.SQS) { // typeof SQSExt
    return async (apiGWRequest: any): Promise<any> => {
        const start = Date.now();
        console.info(`method=updateMaintenanceTrackingQueueRequest bucketName=${sqsBucketName} sqsQueueUrl=${sqsQueueUrl}`);
        if (!apiGWRequest || !apiGWRequest.body) {
            console.error(`method=updateMaintenanceTrackingRequest Empty message`);
            return Promise.reject(invalidRequest("Empty message"));
        }

        try {
            const messageSizeBytes = Buffer.byteLength(apiGWRequest.body);
            var awnsParams : SendMessageRequest = createSendParams(apiGWRequest.body);
            console.info(`method=updateMaintenanceTrackingRequest messageDeduplicationId: ${awnsParams.MessageDeduplicationId} sizeBytes=${messageSizeBytes}`);
            // Will send message's body to S3 if it's larger than the threshold (or alwaysThroughS3)
            await sqsClient.sendMessage(awnsParams).promise();
            const end = Date.now();
            console.info(`method=updateMaintenanceTrackingRequest sqs.sendMessage messageDeduplicationId: ${awnsParams.MessageDeduplicationId} sizeBytes=${messageSizeBytes} count=1 tookMs=${(end - start)}`);
            return Promise.resolve(ok());
        } catch (e) {
            const end = Date.now();
            console.error(`method=updateMaintenanceTrackingRequest Error while sending message to SQSExt tookMs=${(end - start)}`, e);
            return Promise.reject(invalidRequest(`Error while sending message to SQSExt ${JSON.stringify(e)}`));
        }
    }
}

export const handler: (apiGWRequest: any) => Promise<any> = handlerFn(SqsExt.createSQSExtClient(sqsBucketName));

function invalidRequest(msg: string): object {
    return {
        statusCode: 400,
        body: `Invalid request: ${msg}`
    };
}

function ok(): object {
    return {
        statusCode: 200,
        body: 'OK'
    };
}

export function createSendParams(json: string) : SendMessageRequest {
    return {
        MessageBody: json,
        MessageDeduplicationId: MaintenanceTrackingService.createMaintenanceTrackingMessageHash(json),  // Required for FIFO queues
        MessageGroupId: "SameGroupAlways",  // Required for FIFO queues
        QueueUrl: sqsQueueUrl
    };

}
