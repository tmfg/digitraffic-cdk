import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { type SQSEvent } from "aws-lambda";
import { type ReceiveMessageCommandOutput } from "@aws-sdk/client-sqs";
import { MaintenanceTrackingEnvKeys } from "../../keys.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type ExtendedSqsClient } from "sqs-extended-client";
import type { TyokoneenseurannanKirjaus } from "../../model/models.js";
import {
    createExtendedSqsClient,
    createSqsReceiveMessageCommandOutput
} from "../../service/sqs-big-payload.js";
import { handleMessage } from "../../service/maintenance-tracking.js";
import { getErrorMessage } from "../../util/util.js";

const sqsExtendedClient = createExtendedSqsClient();
const method = "MaintenanceTracking.processQueue" as const;

let rdsHolder: RdsHolder | undefined;

function getRdsHolder(): RdsHolder {
    if (!rdsHolder) {
        logger.info({
            method,
            message: `Lambda was cold`
        });
        rdsHolder = RdsHolder.create();
    }
    return rdsHolder;
}

export const handler: (event: SQSEvent) => Promise<PromiseSettledResult<void>[]> = handlerFn(sqsExtendedClient);

export function handlerFn(sqsExtendedClient: ExtendedSqsClient): (event: SQSEvent) => Promise<PromiseSettledResult<void>[]> {
    return async (event: SQSEvent): Promise<PromiseSettledResult<void>[]> => {
        const start = Date.now();
        await getRdsHolder().setCredentials();
        const sqsBucketName = getEnvVariable(MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME);
        const sqsQueueUrl = getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL);
        const region = getEnvVariable("AWS_REGION");
        logger.info({
            method,
            message: `Environment sqsBucketName: ${sqsBucketName}, sqsQueueUrl: ${sqsQueueUrl} events: ${event.Records.length} and region: ${region}`
        });

        logger.debug("LENGHT: " + event.Records.length);
        if (!event.Records.length) {
            return Promise.reject("SQSEvent records was empty.");
        }

        // sqs-extended-client library needs ReceiveMessageCommandOutput to process and fetch the big message
        // from S3, but AWS Lambda SQS eventsource only delivers SQSEvent. Here we re-create dummy
        // ReceiveMessageCommandOutput with needed fields for sqs-extended-client
        const receiveCommandOutputForSqsExtClient: ReceiveMessageCommandOutput = createSqsReceiveMessageCommandOutput(event);

        // logger.debug({ method, message: "output.Messages", value: receiveCommandOutputForSqsExtClient });

        const extendedSqsMessage: ReceiveMessageCommandOutput = await sqsExtendedClient._processReceive(receiveCommandOutputForSqsExtClient);

        if (!extendedSqsMessage.Messages) {
            logger.error({
                method,
                message: `ReceiveMessageCommandOutput.Messages was undefined`
            });
            return Promise.resolve([]);
        }

        // logger.debug({ method, message: "extendedSqsMessage.Messages", value: extendedSqsMessage });

        return Promise.allSettled(
            extendedSqsMessage.Messages.map(async (m) => {

                try {
                    if (m.Body) {
                        const tyokoneenKirjaus = JSON.parse(m.Body) as TyokoneenseurannanKirjaus;
                        await handleMessage(tyokoneenKirjaus);
                        return Promise.resolve();
                    } else {
                        logger.error({
                            method,
                            message: `Message handling failed: Message body was empty.`,
                            customMessageContent: JSON.stringify(m)
                        });
                    }
                    return Promise.reject();
                } catch (e) {
                    logger.error({
                        method,
                        message: `Message handling failed: Invalid JSON.`,
                        customMessageContent: JSON.stringify({ ...m, Body: "{...REMOVED...}" }),
                        error: getErrorMessage(e)
                    });
                    return Promise.reject();
                } finally {
                    logger.info({
                        method,
                        message: `Message handled`,
                        tookMs: Date.now() - start
                    });
                }
            })
        );
    };
}

