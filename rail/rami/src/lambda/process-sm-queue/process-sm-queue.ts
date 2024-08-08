import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { parseUDOTMessage, saveSMMessage } from "../../service/process-sm-message.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { sendDlq, sendUdotMessage } from "../../service/sqs-service.js";

export function handlerFn(): (event: SQSEvent) => Promise<PromiseSettledResult<void>[]> {
    return async (event: SQSEvent) => {
        const start = Date.now();

        try {
            return await Promise.allSettled(event.Records.map(async (r) => {
                const recordBody = r.body;

                try {
                    // parse udot message (unknown track/delay)
                    const udotMessage = parseUDOTMessage(JSON.parse(recordBody));
                    // TODO: parse sectoring
                    // TODO: parse bus replacement

                    if(udotMessage) {
                        logger.info({
                            method: "RAMI-ProcessSmQueue.handler",
                            customDataCount: udotMessage.data.length
                        });

                        await saveSMMessage(udotMessage.messageId, udotMessage.trainNumber, udotMessage.departureDate, recordBody);

                        if(udotMessage.vehicleJourneyName.includes("BUS")) {
                            logger.info({
                                method: "RAMI-ProcessSmQueue.handler",                                
                                message: `Skipping message ${udotMessage.messageId} with vehicleJourneyName ${udotMessage.vehicleJourneyName}`,
                                customSkippedCount: 1
                            });
                        } else {
                            if(udotMessage.data.length > 0) {
                                await sendUdotMessage(udotMessage);
                            }
                        }
                    } else {
                        logger.debug(recordBody);

                        logger.error({
                            method: "RAMI-ProcessSmQueue.handler",
                            message: "Could not parse Sm message"
                        });

                        // send invalid message and error report to dlq
                        await sendDlq("could not parse UDOT", recordBody);
                    }    

                    return Promise.resolve();
                } catch (error) {
                    logException(logger, error);                
                }
            }));
        } finally {
            logger.info({
                method: "RAMI-ProcessSmQueue.handler",
                tookMs: Date.now() - start,
                customRecordCount: event.Records.length
            });
        }
    };
}

export const handler: Handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
