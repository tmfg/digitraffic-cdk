import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { APIGatewayEvent } from "aws-lambda/trigger/api-gateway-proxy";
import { SqsProducer } from "sns-sqs-big-payload";
import { MaintenanceTrackingEnvKeys } from "../../keys";
import { TyokoneenseurannanKirjaus } from "../../model/models";
import * as MaintenanceTrackingService from "../../service/maintenance-tracking";
import * as SqsBigPayload from "../../service/sqs-big-payload";

const sqsBucketName = getEnvVariable(
    MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME
);
const sqsQueueUrl = getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL);
const region = getEnvVariable("AWS_REGION");

const sqsProducerInstance: SqsProducer = SqsBigPayload.createSqsProducer(
    sqsQueueUrl,
    region,
    sqsBucketName
);

export const handler: (
    apiGWRequest: APIGatewayEvent
) => Promise<ResponseValue> = handlerFn(sqsProducerInstance);

export function handlerFn(sqsProducer: SqsProducer) {
    return async (apiGWRequest: APIGatewayEvent): Promise<ResponseValue> => {
        const start = Date.now();
        console.info(
            `method=updateMaintenanceTrackingRequest bucketName=${sqsBucketName} sqsQueueUrl=${sqsQueueUrl} and region: ${region} apiGWRequest type: ${typeof apiGWRequest}`
        );
        if (!apiGWRequest.body) {
            console.error(
                `method=updateMaintenanceTrackingRequest Empty message`
            );
            return Promise.reject(invalidRequest(`Empty message`));
        }

        try {
            const messageSizeBytes = Buffer.byteLength(apiGWRequest.body);
            const messageDeduplicationId =
                MaintenanceTrackingService.createMaintenanceTrackingMessageHash(
                    apiGWRequest.body
                );
            // console.info(`method=updateMaintenanceTrackingRequest messageDeduplicationId: ${messageDeduplicationId} sizeBytes=${messageSizeBytes}`);
            // Will send message's body to S3 if it's larger than max SQS message size
            const json = JSON.parse(
                apiGWRequest.body
            ) as TyokoneenseurannanKirjaus;
            await sqsProducer.sendJSON(json);
            console.info(
                `method=updateMaintenanceTrackingRequest sqs.sendMessage messageDeduplicationId: ${messageDeduplicationId} sizeBytes=${messageSizeBytes} count=1 tookMs=${
                    Date.now() - start
                }`
            );
            return Promise.resolve(ok());
        } catch (e) {
            const end = Date.now();
            console.error(
                `method=updateMaintenanceTrackingRequest Error while sending message to SQS tookMs=${
                    end - start
                }`,
                e
            );
            return Promise.reject(
                invalidRequest(
                    `Error while sending message to SQS: ${getErrorMessage(e)}`
                )
            );
        }
    };
}

function getErrorMessage(maybeError: unknown) {
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
        body: `Invalid request: ${msg}`,
    };
}

export function ok(): ResponseValue {
    return {
        statusCode: 200,
        body: "OK",
    };
}