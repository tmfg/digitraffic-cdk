import {AtonProps} from "./app-props";
import {AtonEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredDBFunction, MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";
import {Queue} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {Duration} from "@aws-cdk/core";

export function create(stack: DigitrafficStack, s124Queue: Queue) {
    const updateFaultsLambda = createUpdateFaultsLambda(stack);
    const sendS124Lambda = createSendS124Lambda(stack);

    Scheduler.everyMinutes(stack, 'Rule', 10, updateFaultsLambda);

    sendS124Lambda.addEventSource(new SqsEventSource(s124Queue, {
        batchSize: 8,
        maxBatchingWindow: Duration.seconds(5)
    }));
}

function createUpdateFaultsLambda(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[AtonEnvKeys.INTEGRATIONS] = JSON.stringify((stack.configuration as AtonProps).integrations);

    return MonitoredDBFunction.create(stack, 'update-faults', environment, {
        memorySize: 512
    });
}

function createSendS124Lambda(stack: DigitrafficStack): MonitoredFunction {
    return MonitoredDBFunction.create(stack, 'send-s124', undefined, {
        memorySize: 128,
        reservedConcurrentExecutions: 15,
        timeout: 60
    });
}
