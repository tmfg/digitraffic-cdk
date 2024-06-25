import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { parseSmMessage } from "../../service/process-sm-message.js";

export function handlerFn(): (event: SQSEvent) => Promise<PromiseSettledResult<void>[]> {
    return (event: SQSEvent) => {
        return Promise.allSettled(
            event.Records.map(async (r) => {
                const start = Date.now();
                const recordBody = r.body;

                try {
                    const parsedSmMessage = parseSmMessage(JSON.parse(recordBody));
                    logger.debug({
                        method: "RAMI-ProcessSmQueue.handler",
                        customParsedRamiMessage: JSON.stringify(parsedSmMessage)
                    });
    

                    // TODO parse message
                    // process
                    // error handling, DLQ

                    // do nothing for now
                    return await Promise.resolve();
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
