import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default.js";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { SQSEvent } from "aws-lambda";
import { parseMessage, processMessage } from "../../service/message.js";

export function handlerFn() {
    return (event: SQSEvent) => {
        return Promise.allSettled(
            event.Records.map(async (r) => {
                const start = Date.now();
                const parsedRamiMessage = parseMessage(JSON.parse(r.body));
                logger.info({
                    method: "RAMI-ProcessQueue.handler",
                    customParsedRamiMessage: JSON.stringify(parsedRamiMessage)
                });
                if (parsedRamiMessage) await processMessage(parsedRamiMessage);
                logger.info({
                    method: "RAMI-ProcessQueue.handler",
                    tookMs: Date.now() - start
                });
            })
        );
    };
}

export const handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
