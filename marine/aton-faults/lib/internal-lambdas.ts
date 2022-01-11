import {AtonProps} from "./app-props";
import {AtonEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {MonitoredDBFunction, MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {Scheduler} from "digitraffic-common/aws/infra/scheduler";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {Duration} from "aws-cdk-lib";

export function create(stack: DigitrafficStack, s124Queue: Queue) {
    const updateFaultsLambda = createUpdateFaultsLambda(stack);
    const sendS124Lambda = createSendS124Lambda(stack);

    Scheduler.everyMinutes(stack, 'Rule', 10, updateFaultsLambda);

    sendS124Lambda.addEventSource(new SqsEventSource(s124Queue, {
        batchSize: 6,
        maxBatchingWindow: Duration.seconds(5),
    }));
}

function createUpdateFaultsLambda(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[AtonEnvKeys.INTEGRATIONS] = JSON.stringify((stack.configuration as AtonProps).integrations);

    return MonitoredDBFunction.create(stack, 'update-faults', environment, {
        memorySize: 512,
    });
}

function createSendS124Lambda(stack: DigitrafficStack): MonitoredFunction {
    return MonitoredDBFunction.create(stack, 'send-s124', undefined, {
        memorySize: 256,
        reservedConcurrentExecutions: 15,
        timeout: 60,
    });
}
