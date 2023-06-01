import { Queue } from "aws-cdk-lib/aws-sqs";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import {
    MonitoredDBFunction,
    MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";

export function create(stack: DigitrafficStack, ramiMessageQueue: Queue): void {
    createProcessQueueLambda(stack, ramiMessageQueue);
}

function createProcessQueueLambda(stack: DigitrafficStack, queue: Queue): MonitoredFunction {
    const processQueueLambda = MonitoredDBFunction.create(stack, "process-queue", undefined, {
        memorySize: 256,
        reservedConcurrentExecutions: 5,
        timeout: 10
    });
    processQueueLambda.addEventSource(new SqsEventSource(queue));
    return processQueueLambda;
}
