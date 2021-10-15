import {databaseFunctionProps} from 'digitraffic-common/stack/lambda-configs';
import {DigitrafficLogSubscriptions} from 'digitraffic-common/stack/subscription';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {AtonEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";

export function create(stack: DigitrafficStack, secret: ISecret, sendFaultTopic: Topic) {
    createUpdateFaultsLambda(stack, secret);
    createSendFaultLambda(stack, secret, sendFaultTopic);
}

function createUpdateFaultsLambda(stack: DigitrafficStack, secret: ISecret) {
    const environment = stack.createDefaultLambdaEnvironment('ATON');
    environment[AtonEnvKeys.INTEGRATIONS] = JSON.stringify((stack.configuration as AtonProps).integrations);

    const lambdaConf = databaseFunctionProps(stack, environment, 'ATON-UpdateFaults', 'update-faults', {
        memorySize: 512
    });

    const lambda = MonitoredFunction.create(stack, 'UpdateFaults', lambdaConf);
    secret.grantRead(lambda);

    Scheduler.everyMinutes(stack, 'Rule', 10, lambda);

    new DigitrafficLogSubscriptions(stack, lambda);
}

function createSendFaultLambda(stack: DigitrafficStack, secret: ISecret, sendFaultTopic: Topic) {
    const functionName = "ATON-SendFault";
    const environment = stack.createDefaultLambdaEnvironment('ATON');

    const lambdaConf = databaseFunctionProps(stack, environment, 'ATON-SendFault', 'send-fault', {
        memorySize: 512
    });

    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf);
    secret.grantRead(lambda);
    sendFaultTopic.addSubscription(new LambdaSubscription(lambda));

    new DigitrafficLogSubscriptions(stack, lambda);
}
