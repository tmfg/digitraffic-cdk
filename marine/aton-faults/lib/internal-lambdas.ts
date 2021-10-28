import {DigitrafficLogSubscriptions} from 'digitraffic-common/stack/subscription';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";
import {AtonEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";

export function create(stack: DigitrafficStack, sendFaultTopic: Topic) {
    const updateFaultsLambda = createUpdateFaultsLambda(stack);
    const sendFaultLambda = createSendFaultLambda(stack);

    Scheduler.everyMinutes(stack, 'Rule', 10, updateFaultsLambda);
    sendFaultTopic.addSubscription(new LambdaSubscription(sendFaultLambda));

    stack.grantSecret(updateFaultsLambda, sendFaultLambda);

    new DigitrafficLogSubscriptions(stack, updateFaultsLambda, sendFaultLambda);
}

function createUpdateFaultsLambda(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[AtonEnvKeys.INTEGRATIONS] = JSON.stringify((stack.configuration as AtonProps).integrations);

    return MonitoredFunction.createV2(stack, 'update-faults', environment, {
        functionName: 'UpdateFaults',
        memorySize: 512
    });
}

function createSendFaultLambda(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();

    return MonitoredFunction.createV2(stack, 'send-s124', environment, {
        memorySize: 512
    });
}
