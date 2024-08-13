import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import { parseRosmMessage, processRosmMessage } from "../../service/process-rosm-message.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { sendDlq } from "../../service/sqs-service.js";

export function handlerFn(): (event: SQSEvent) => Promise<PromiseSettledResult<void>[]> {
    return async (event: SQSEvent) => {
        return await Promise.allSettled(
            event.Records.map(async (r) => {
                const start = Date.now();
                const recordBody = r.body;
                const parsedRamiMessage = parseRosmMessage(JSON.parse(recordBody));
                logger.debug({
                    method: "RAMI-ProcessRosmQueue.handler",
                    customParsedRamiMessage: JSON.stringify(parsedRamiMessage)
                });
                if (parsedRamiMessage) {
                    try {
                        await processRosmMessage(parsedRamiMessage);
                    } catch (error) {
                        logException(logger, error);
                        // send original message to dlq on error
                        
                        await sendDlq({
                            messageType: "ROSM",
                            errors: JSON.stringify(error),
                            message: recordBody
                        });

                        return Promise.reject(error);
                    }
                }
                logger.info({
                    method: "RAMI-ProcessRosmQueue.handler",
                    tookMs: Date.now() - start
                });
                return Promise.resolve();
            })
        );
    };
}

export const handler: Handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
