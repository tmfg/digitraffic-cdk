import * as events from '@aws-cdk/aws-events';
const lambda = require('@aws-cdk/aws-lambda');
import * as ec2 from '@aws-cdk/aws-ec2';
import * as targets from '@aws-cdk/aws-events-targets';
import {Construct} from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import {dbLambdaConfiguration} from './cdk-util';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';

export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct,
    props: Props) {

    createUpdateAnnotationsLambda(vpc, lambdaDbSg, props, stack);
}

function createUpdateAnnotationsLambda(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct) {

    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('dist/lambda/update-annotations'),
        handler: 'lambda-update-annotations.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_USER = props.integration.username;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_PASS = props.integration.password;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_URL = props.integration.url + "/annotations";
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_LOGIN_URL = props.integration.url + "/login";

    const updateAnnotationsLambda = new lambda.Function(stack, 'UpdateAnnotations', lambdaConf);

    const rule = new events.Rule(stack, 'Rule', {
        schedule: events.Schedule.expression('cron(1 * * ? * * *)')
    });
    rule.addTarget(new targets.LambdaFunction(updateAnnotationsLambda));
}
