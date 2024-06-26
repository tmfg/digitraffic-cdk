import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { type APIGatewayEvent } from "aws-lambda";
import { type SqsProducer } from "sns-sqs-big-payload";
import { MaintenanceTrackingEnvKeys } from "../../keys.js";
import { type TyokoneenseurannanKirjaus } from "../../model/models.js";
import * as MaintenanceTrackingService from "../../service/maintenance-tracking.js";
import * as SqsBigPayload from "../../service/sqs-big-payload.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
const sqsBucketName = getEnvVariable(MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME);
const sqsQueueUrl = getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL);
const region = getEnvVariable("AWS_REGION");

const sqsProducerInstance: SqsProducer = SqsBigPayload.createSqsProducer(sqsQueueUrl, region, sqsBucketName);

export const handler: (apiGWRequest: APIGatewayEvent) => Promise<ResponseValue> =
    handlerFn(sqsProducerInstance);

export function handlerFn(sqsProducer: SqsProducer): (request: APIGatewayEvent) => Promise<ResponseValue> {
    return async (apiGWRequest: APIGatewayEvent): Promise<ResponseValue> => {
        const start = Date.now();
        logger.info({
            method: "MaintenanceTracking.updateQueue",
            message: `bucketName=${sqsBucketName} sqsQueueUrl=${sqsQueueUrl} and region: ${region} apiGWRequest type: ${typeof apiGWRequest}`
        });
        if (!apiGWRequest.body) {
            logger.info({
                method: "MaintenanceTracking.updateQueue",
                message: `empty message body`
            });
            return Promise.reject(invalidRequest(`Empty message`));
        }

        try {
            const messageSizeBytes = Buffer.byteLength(apiGWRequest.body);
            const messageDeduplicationId = MaintenanceTrackingService.createMaintenanceTrackingMessageHash(
                apiGWRequest.body
            );

            // logger.debug(`method=updateMaintenanceTrackingRequest messageDeduplicationId: ${messageDeduplicationId} sizeBytes=${messageSizeBytes}`);
            // Will send message's body to S3 if it's larger than max SQS message size
            const json = JSON.parse(apiGWRequest.body) as TyokoneenseurannanKirjaus;
            await sqsProducer.sendJSON(json);
            logger.info({
                method: "MaintenanceTracking.updateQueue",
                message: `sqs.sendMessage messageDeduplicationId: ${messageDeduplicationId}`,
                tookMs: Date.now() - start,
                customSizeBytes: messageSizeBytes,
                customCount: 1
            });
            return Promise.resolve(ok());
        } catch (e) {
            const end = Date.now();
            logger.error({
                method: "MaintenanceTracking.updateQueue",
                message: `error while sending message to SQS`,
                tookMs: end - start,
                error: e
            });
            return Promise.reject(
                invalidRequest(`Error while sending message to SQS: ${getErrorMessage(e)}`)
            );
        }
    };
}

function getErrorMessage(maybeError: unknown): string {
    if (maybeError instanceof Error) {
        return maybeError.name + ": " + maybeError.message;
    }
    return String(maybeError);
}

interface ResponseValue {
    readonly statusCode: number;
    readonly body: string;
}

export function invalidRequest(msg: string): ResponseValue {
    return {
        statusCode: 400,
        body: `Invalid request: ${msg}`
    };
}

export function ok(): ResponseValue {
    return {
        statusCode: 200,
        body: "OK"
    };
}
