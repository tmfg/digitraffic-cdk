import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default.js";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import { parseMessage, processMessage } from "../../service/process-message.js";
import { logException } from "@digitraffic/common/dist/utils/logging.js";

export function handlerFn(): (event: SQSEvent) => Promise<PromiseSettledResult<void>[]> {
    return (event: SQSEvent) => {
        return Promise.allSettled(
            event.Records.map(async (r) => {
                const start = Date.now();
                const parsedRamiMessage = parseMessage(JSON.parse(r.body));
                logger.info({
                    method: "RAMI-ProcessQueue.handler",
                    customParsedRamiMessage: JSON.stringify(parsedRamiMessage)
                });
                if (parsedRamiMessage) {
                    await processMessage(parsedRamiMessage).catch((error): unknown => {
                        logException(logger, error);
                        return Promise.reject(error);
                    });
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
