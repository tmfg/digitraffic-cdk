import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { parseSmMessage, processSmMessage } from "../../service/process-sm-message.js";
import { logException } from "@digitraffic/common/dist/utils/logging";

export function handlerFn(): (event: SQSEvent) => Promise<void> {
    return async (event: SQSEvent) => {
        await Promise.allSettled(
            event.Records.map(async (r) => {
                const start = Date.now();
                const recordBody = r.body;

                try {
                    const parsedSmMessage = parseSmMessage(JSON.parse(recordBody));

                    if(parsedSmMessage) {
                        logger.debug({
                            method: "RAMI-ProcessSmQueue.handler",
                            customParsedRamiMessage: JSON.stringify(parsedSmMessage)
                        });

                        await processSmMessage(parsedSmMessage);
                    } else {
                        logger.debug(recordBody);

                        logger.error({
                            method: "RAMI-ProcessSmQueue.handler",
                            message: "Could not parse Sm message"
                        });

                        // DLQ??
                    }    

                    return await Promise.resolve();
                } catch (error) {
                    logException(logger, error);                
                } finally {
                    logger.info({
                        method: "RAMI-ProcessSmQueue.handler",
                        tookMs: Date.now() - start,
                        customValidSmMessage: JSON.stringify(recordBody)
                    });
                }
            })
        );
    };
}

export const handler: Handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
