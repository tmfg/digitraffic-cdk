import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {dbFunctionProps} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {TrafficType} from "digitraffic-common/model/traffictype";
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
    const lambdaConf = dbFunctionProps(stack, {
        functionName: functionName,
        memorySize: 128,
        code: new AssetCode('dist/lambda'),
        handler: 'lambda-update-lights.handler',
        environment,
        timeout: 10,
        reservedConcurrentExecutions: 1
    });
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf, TrafficType.MARINE);
    secret.grantRead(lambda);
    createSubscription(lambda, functionName, stack.configuration.logsDestinationArn, stack);
    return lambda;
}
