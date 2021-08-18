import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Stack} from '@aws-cdk/core';
import {dbLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {Props} from "./app-props";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {ShiplightEnvKeys} from "./keys";

export function create(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack) {

    const updateLightsLambda = createUpdateLightsLambda(secret, vpc, lambdaDbSg, props, stack);
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
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack): Function {

    const environment: any = {};
    environment[ShiplightEnvKeys.SECRET_ID] = props.secretId;

    const functionName = 'Shiplight-UpdateLights';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        memorySize: 128,
        code: new AssetCode('dist/lambda'),
        handler: 'lambda-update-lights.handler',
        environment,
        reservedConcurrentExecutions: 1
    });
    const lambda = new Function(stack, functionName, lambdaConf);
    secret.grantRead(lambda);
    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
    return lambda;
}
