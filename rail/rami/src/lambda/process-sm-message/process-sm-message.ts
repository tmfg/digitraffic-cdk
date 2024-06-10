import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";

export function handlerFn(): (event: SQSEvent) => void {
    return (event: SQSEvent) => {
    };
}

export const handler: Handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
