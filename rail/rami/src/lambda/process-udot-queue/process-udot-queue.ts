import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { processUDOTMessage } from "../../service/process-udot-message.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import type { UnknownDelayOrTrackMessage } from "../../model/dt-rosm-message.js";

export function handlerFn(): (event: SQSEvent) => Promise<PromiseSettledResult<void>[]> {
    return async (event: SQSEvent) => {
        return await Promise.allSettled(
            event.Records.map(async (r) => {
                const start = Date.now();
                const recordBody = r.body;

                try {
                    const udotMessage = JSON.parse(recordBody) as UnknownDelayOrTrackMessage;

                    logger.info({
                        method: "RAMI-ProcessUDOTQueue.handler",
                        customCount: udotMessage.data.length
                    })

                    return processUDOTMessage(udotMessage);                    
                } catch (error) {
                    logException(logger, error);                
                } finally {
                    logger.info({
                        method: "RAMI-ProcessUDOTQueue.handler",
                        tookMs: Date.now() - start
                    });
                }
            })
        );
    };
}

export const handler: Handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
