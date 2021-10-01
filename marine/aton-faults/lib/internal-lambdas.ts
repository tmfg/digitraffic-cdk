import {Rule, Schedule} from '@aws-cdk/aws-events';
import {AssetCode} from '@aws-cdk/aws-lambda';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Duration} from '@aws-cdk/core';
import {dbFunctionProps} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {AtonEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";

export function create(stack: DigitrafficStack, secret: ISecret, sendFaultTopic: Topic) {
    createUpdateFaultsLambda(stack, secret);
    createSendFaultLambda(stack, secret, sendFaultTopic);
}

function createUpdateFaultsLambda(stack: DigitrafficStack, secret: ISecret) {
    const environment = stack.createDefaultLambdaEnvironment('ATON');
    environment[AtonEnvKeys.INTEGRATIONS] = JSON.stringify((stack.configuration as AtonProps).integrations);

    const functionName = "ATON-UpdateFaults";
    const lambdaConf = dbFunctionProps(stack, {
        memorySize: 512,
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-faults'),
        handler: 'lambda-update-faults.handler',
        environment
    });

    const lambda = MonitoredFunction.create(stack, 'UpdateFaults', lambdaConf, TrafficType.MARINE);
    secret.grantRead(lambda);
    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(lambda));
    createSubscription(lambda, functionName, stack.configuration.logsDestinationArn, stack);
}

function createSendFaultLambda(stack: DigitrafficStack, secret: ISecret, sendFaultTopic: Topic) {
    const functionName = "ATON-SendFault";
    const environment = stack.createDefaultLambdaEnvironment('ATON');

    const lambdaConf = dbFunctionProps(stack, {
        memorySize: 512,
        functionName: functionName,
        code: new AssetCode('dist/lambda/send-fault'),
        handler: 'lambda-send-fault.handler',
        environment
    });
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf, TrafficType.MARINE);
    secret.grantRead(lambda);
    sendFaultTopic.addSubscription(new LambdaSubscription(lambda));
    createSubscription(lambda, functionName, stack.configuration.logsDestinationArn, stack);
}
