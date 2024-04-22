import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import { parseMessage, processMessage } from "../../service/process-message.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { sendToSqs } from "../../util/sqs.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";

const DLQ_URL = getEnvVariable("DLQ_URL");

export function handlerFn(): (event: SQSEvent) => Promise<PromiseSettledResult<void>[]> {
    return (event: SQSEvent) => {
        return Promise.allSettled(
            event.Records.map(async (r) => {
                const start = Date.now();
                const recordBody = r.body;
                const parsedRamiMessage = parseMessage(JSON.parse(recordBody));
                logger.debug({
                    method: "RAMI-ProcessQueue.handler",
                    customParsedRamiMessage: JSON.stringify(parsedRamiMessage)
                });
                if (parsedRamiMessage) {
                    try {
                        await processMessage(parsedRamiMessage);
                    } catch (error) {
                        logException(logger, error);
                        // send original message to dlq on error
                        await sendToSqs(
                            DLQ_URL,
                            2,
                            `[{"errors":"${JSON.stringify(error)}"}, ${recordBody}}]`,
                            parsedRamiMessage.id
                        );
                        return Promise.reject(error);
                    }
                }
                logger.info({
                    method: "RAMI-ProcessQueue.handler",
                    tookMs: Date.now() - start
                });
                return Promise.resolve();
            })
        );
    };
}

export const handler: Handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
