import { SQSEvent, SQSRecord } from "aws-lambda";
import { SqsConsumer } from "sns-sqs-big-payload";
import { MaintenanceTrackingEnvKeys } from "../../keys";
import * as SqsBigPayload from "../../service/sqs-big-payload";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";

const sqsBucketName = getEnvVariable(
    MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME
);
const sqsQueueUrl = getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL);

const region = getEnvVariable("AWS_REGION");
const rdsHolder = RdsHolder.create();

const sqsConsumerInstance: SqsConsumer = SqsBigPayload.createSqsConsumer(
    sqsQueueUrl,
    region,
    "processMaintenanceTrackingQueue"
);

export const handler = middy(handlerFn(sqsConsumerInstance)).use(
    sqsPartialBatchFailureMiddleware()
);

export function handlerFn(sqsConsumer: SqsConsumer) {
    return (event: SQSEvent): Promise<PromiseSettledResult<void>[]> => {
        return rdsHolder.setCredentials().then(async () => {
            console.info(
                `method=processMaintenanceTrackingQueue Environment sqsBucketName: ${sqsBucketName}, sqsQueueUrl: ${sqsQueueUrl} events: ${event.Records.length} and region: ${region}`
            );

            return Promise.allSettled(
                event.Records.map(async (record: SQSRecord) => {
                    try {
                        // clone event as library uses PascalCase properties -> include properties in camelCase and PascalCase
                        const clone = cloneRecordWithCamelAndPascal(record);
                        await sqsConsumer.processMessage(clone, {
                            deleteAfterProcessing: false,
                        }); // Delete is done by S3 lifecycle
                        return Promise.resolve();
                    } catch (e) {
                        console.error(
                            `method=processMaintenanceTrackingQueue Error while handling tracking from SQS`,
                            e
                        );
                        return Promise.reject(e);
                    }
                })
            );
        });
    };
}

export function cloneRecordWithCamelAndPascal(
    record: Record<string, any>
): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clone: Record<string, any> = {};
    for (const key in record) {
        if (key in record) {
            clone[key.charAt(0).toUpperCase() + key.substring(1)] = record[key];
            clone[key.charAt(0).toLowerCase() + key.substring(1)] = record[key];
        }
    }
    return clone;
}
