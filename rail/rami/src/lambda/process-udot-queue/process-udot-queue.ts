import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure"
import type { Handler, SQSEvent } from "aws-lambda";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { processUdotMessage } from "../../service/process-udot-message.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import type { UnknownDelayOrTrackMessage } from "../../model/dt-rosm-message.js";

export function handlerFn(): (event: SQSEvent) => Promise<PromiseSettledResult<void>[]> {
    return async (event: SQSEvent) => {
        const start = Date.now();

        try {
            return await Promise.allSettled(event.Records.map(async (r) => {
                const recordBody = r.body;

                try {
                    const udotMessage = JSON.parse(recordBody) as UnknownDelayOrTrackMessage;

                    logger.info({
                        method: "RAMI-ProcessUDOTQueue.handler",
                        message: `processing ${udotMessage.trainNumber} ${udotMessage.departureDate}`,
                        customCount: udotMessage.data.length
                    })

                    return processUdotMessage(udotMessage);                    
                } catch (error) {
                    logException(logger, error);                
                }
            }));        
        } finally {
            logger.info({
                method: "RAMI-ProcessUDOTQueue.handler",
                tookMs: Date.now() - start,
                customRecordCount: event.Records.length
            });
        }
    };
}

export const handler: Handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());

