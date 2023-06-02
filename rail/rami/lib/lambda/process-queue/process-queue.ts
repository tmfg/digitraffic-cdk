import { SQSEvent } from "aws-lambda";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { processRamiMessage } from "../../service/message";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";

export function handlerFn(): (event: SQSEvent) => void {
    return (event: SQSEvent) => {
        event.Records.map((r) => {
            const parsedRamiMessage = processRamiMessage(JSON.parse(r.body));
            logger.info({
                method: "RAMI-ProcessQueue.handler",
                customParsedRamiMessage: JSON.stringify(parsedRamiMessage)
            });
        });
    };
}

export const handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
