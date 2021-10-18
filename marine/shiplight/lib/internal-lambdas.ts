import {Function} from '@aws-cdk/aws-lambda';
import {databaseFunctionProps} from 'digitraffic-common/stack/lambda-configs';
import {DigitrafficLogSubscriptions} from 'digitraffic-common/stack/subscription';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";

export function create(
    secret: ISecret,
    stack: DigitrafficStack) {

    Scheduler.everyMinute(stack, 'Shiplight-Scheduler', createUpdateLightsLambda(secret, stack));
}

function createUpdateLightsLambda(
    secret: ISecret,
    stack: DigitrafficStack): Function {

    const environment = stack.createDefaultLambdaEnvironment('Shiplight');

    const functionName = 'Shiplight-UpdateLights';
    const lambdaConf = databaseFunctionProps(stack, environment, functionName, 'update-lights', {
        singleLambda: true,
        timeout: 10
    });
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf);
    secret.grantRead(lambda);

    new DigitrafficLogSubscriptions(stack, lambda);

    return lambda;
}
