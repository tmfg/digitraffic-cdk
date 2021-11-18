import {DigitrafficLogSubscriptions} from 'digitraffic-common/stack/subscription';
import {AtonProps} from "./app-props";
import {AtonEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
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

    stack.grantSecret(updateFaultsLambda, sendS124Lambda);

    new DigitrafficLogSubscriptions(stack, updateFaultsLambda, sendS124Lambda);
}

function createUpdateFaultsLambda(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[AtonEnvKeys.INTEGRATIONS] = JSON.stringify((stack.configuration as AtonProps).integrations);

    return MonitoredFunction.createV2(stack, 'update-faults', environment, {
        memorySize: 512
    });
}

function createSendS124Lambda(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();

    return MonitoredFunction.createV2(stack, 'send-s124', environment, {
        memorySize: 128,
        reservedConcurrentExecutions: 15,
        timeout: 60
    });
}
