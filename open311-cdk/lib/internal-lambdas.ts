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

    const orphanRequestsFoundTopic = new sns.Topic(stack, 'OrphanRequestsFoundTopic', {
        displayName: 'OrphanRequestsFoundTopic'
    });
    createCheckOrphansLambda(orphanRequestsFoundTopic, vpc, lambdaDbSg, props, stack);
    createUpdateServicesLambda(orphanRequestsFoundTopic, vpc, lambdaDbSg, props, stack);
}

function createCheckOrphansLambda(
    orphanRequestsFoundTopic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct) {

    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('lib/lambda/check-orphan-requests'),
        handler: 'lambda-check-orphan-requests.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ORPHAN_SNS_TOPIC_ARN = orphanRequestsFoundTopic.topicArn;
    const checkOrphansLambda = new lambda.Function(stack, 'CheckOrphanRequests', lambdaConf);
    const rule = new events.Rule(stack, 'Rule', {
        schedule: events.Schedule.expression('cron(0 2 * * ? *)')
    });
    rule.addTarget(new targets.LambdaFunction(checkOrphansLambda));
}

function createUpdateServicesLambda(
    orphanRequestsFoundTopic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct) {

    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('lib/lambda/update-services'),
        handler: 'lambda-update-services.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_USER = props.integration.username;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_PASS = props.integration.password;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_URL = props.integration.url;
    const updateServicesLambda = new lambda.Function(stack, 'UpdateServices', lambdaConf);
    orphanRequestsFoundTopic.addSubscription(new subscriptions.LambdaSubscription(updateServicesLambda));
}
