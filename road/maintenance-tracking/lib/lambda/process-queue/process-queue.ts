import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { MaintenanceTrackingEnvKeys } from "../../keys";
import { getSqsConsumerInstance } from "../../service/sqs-big-payload";

let rdsHolder: RdsHolder | undefined;

function getRdsHolder() {
    if (!rdsHolder) {
        console.info(`method=processMaintenanceTrackingQueue lambda was cold`);
        rdsHolder = RdsHolder.create();
    }
    return rdsHolder;
}

export const handler = middy(handlerFn()).use(
    sqsPartialBatchFailureMiddleware()
);

export function handlerFn() {
    return (event: SQSEvent): Promise<PromiseSettledResult<void>[]> => {
        return getRdsHolder()
            .setCredentials()
            .then(async () => {
                const sqsBucketName = getEnvVariable(
                    MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME
                );
                const sqsQueueUrl = getEnvVariable(
                    MaintenanceTrackingEnvKeys.SQS_QUEUE_URL
                );
                const region = getEnvVariable("AWS_REGION");

                console.info(
                    `method=processMaintenanceTrackingQueue Environment sqsBucketName: ${sqsBucketName}, sqsQueueUrl: ${sqsQueueUrl} events: ${event.Records.length} and region: ${region}`
                );

                const sqsConsumer = getSqsConsumerInstance();

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record: Record<string, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clone: Record<string, any> = {};
    for (const key in record) {
        if (key in record) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            clone[key.charAt(0).toUpperCase() + key.substring(1)] = record[key];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            clone[key.charAt(0).toLowerCase() + key.substring(1)] = record[key];
        }
    }
    return clone;
}
