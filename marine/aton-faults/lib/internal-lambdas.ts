import {Rule,Schedule} from '@aws-cdk/aws-events';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {DatabaseEnvironmentKeys} from "digitraffic-common/secrets/dbsecret";
import {AtonEnvKeys} from "./keys";

export function create(
    secret: ISecret,
    sendFaultTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Stack) {

    createUpdateFaultsLambda(secret, vpc, lambdaDbSg, props, stack);
    createSendFaultLambda(secret, sendFaultTopic, vpc, lambdaDbSg, props, stack);
}

function createUpdateFaultsLambda(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Stack) {

    const environment: LambdaEnvironment = {};
    environment[AtonEnvKeys.SECRET_ID] = props.secretId;
    environment[AtonEnvKeys.INTEGRATIONS] = JSON.stringify(props.integrations);
    environment[DatabaseEnvironmentKeys.DB_APPLICATION] = 'ATON';

    const functionName = "ATON-UpdateFaults";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        memorySize: 512,
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-faults'),
        handler: 'lambda-update-faults.handler',
        environment
    });
    const lambda = new Function(stack, 'UpdateFaults', lambdaConf);
    secret.grantRead(lambda);
    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(lambda));
    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}

function createSendFaultLambda(
    secret: ISecret,
    sendFaultTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Stack) {

    const functionName = "ATON-SendFault";
    const environment: LambdaEnvironment = {};
    environment[AtonEnvKeys.SECRET_ID] = props.secretId;
    environment[DatabaseEnvironmentKeys.DB_APPLICATION] = 'ATON';

    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        memorySize: 256,
        functionName: functionName,
        code: new AssetCode('dist/lambda/send-fault'),
        handler: 'lambda-send-fault.handler',
        environment
    });
    const lambda = new Function(stack, functionName, lambdaConf);
    secret.grantRead(lambda);
    sendFaultTopic.addSubscription(new LambdaSubscription(lambda));
    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}
