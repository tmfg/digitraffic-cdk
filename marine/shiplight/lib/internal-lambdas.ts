import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {Stack} from '@aws-cdk/core';
import {dbFunctionProps, dbLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {ShiplightEnvKeys} from "./keys";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {DatabaseEnvironmentKeys} from "digitraffic-common/secrets/dbsecret";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {TrafficType} from "digitraffic-common/model/traffictype";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";

export function create(
    secret: ISecret,
    stack: DigitrafficStack) {

    const updateLightsLambda = createUpdateLightsLambda(secret, stack);
    const schedulingRule = createScheduler(stack);
    schedulingRule.addTarget(new LambdaFunction(updateLightsLambda));
}

function createScheduler(stack: Stack): Rule {
    const ruleName = 'Shiplight-Scheduler'
    return new Rule(stack, ruleName, {
        ruleName,
        schedule: Schedule.expression('cron(*/1 * * * ? *)') // every 1 minutes
    });
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
