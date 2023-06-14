import type { Queue } from "aws-cdk-lib/aws-sqs";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack.js";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import {
    MonitoredDBFunction,
    MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction.js";

export function create(stack: DigitrafficStack, ramiMessageQueue: Queue): void {
    createProcessQueueLambda(stack, ramiMessageQueue);
}

function createProcessQueueLambda(stack: DigitrafficStack, queue: Queue): MonitoredFunction {
    const lambdaEnv = {
        ...(stack.configuration.secretId && { SECRET_ID: stack.configuration.secretId }),
        DB_APPLICATION: "avoindata"
    };
    const processQueueLambda = MonitoredDBFunction.create(stack, "process-queue", lambdaEnv, {
        memorySize: 256,
        reservedConcurrentExecutions: 5,
        timeout: 10
    });
    processQueueLambda.addEventSource(new SqsEventSource(queue));
    return processQueueLambda;
}
