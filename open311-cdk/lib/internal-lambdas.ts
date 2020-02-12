import * as events from '@aws-cdk/aws-events';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as targets from '@aws-cdk/aws-events-targets';
import {Construct} from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import {dbLambdaConfiguration} from './cdk-util';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';

// returns lambda names for log group subscriptions
export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct,
    props: Props): string[] {

    const orphanRequestsFoundTopic = new sns.Topic(stack, 'OrphanRequestsFoundTopic', {
        displayName: 'OrphanRequestsFoundTopic'
    });
    const missingStatesLambdaTopic = new sns.Topic(stack, 'OrphanRequestsFoundTopic', {
        displayName: 'OrphanRequestsFoundTopic'
    });
    const checkOrphansLambdaName = createCheckOrphanRequestsLambda(orphanRequestsFoundTopic, vpc, lambdaDbSg, props, stack);
    const checkMissingStatesLambdaName = createCheckMissingStatesLambda(missingStatesLambdaTopic, vpc, lambdaDbSg, props, stack);
    const updateServicesLambdaName = createUpdateServicesLambda(orphanRequestsFoundTopic, vpc, lambdaDbSg, props, stack);
    const updateStatesLambdaName = createUpdateStatesLambda(missingStatesLambdaTopic, vpc, lambdaDbSg, props, stack);

    return [checkOrphansLambdaName, checkMissingStatesLambdaName, updateServicesLambdaName, updateStatesLambdaName];
}

function createCheckOrphanRequestsLambda(
    orphanRequestsFoundTopic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct): string {

    const checkOrphanRequestsId = 'CheckOrphanRequests';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: checkOrphanRequestsId,
        code: new lambda.AssetCode('dist/lambda/check-orphan-requests'),
        handler: 'lambda-check-orphan-requests.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ORPHAN_SNS_TOPIC_ARN = orphanRequestsFoundTopic.topicArn;
    const checkOrphansLambda = new lambda.Function(stack, checkOrphanRequestsId, lambdaConf);
    const rule = new events.Rule(stack, 'Rule', {
        schedule: events.Schedule.expression('cron(0 2 * * ? *)')
    });
    rule.addTarget(new targets.LambdaFunction(checkOrphansLambda));

    return checkOrphanRequestsId;
}

function createCheckMissingStatesLambda(
    topic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct): string {

    const checkMissingStatesId = 'CheckMissingStates';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: checkMissingStatesId,
        code: new lambda.AssetCode('dist/lambda/check-missing-states'),
        handler: 'lambda-check-missing-states.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ORPHAN_SNS_TOPIC_ARN = topic.topicArn;
    const checkMissingStatesLambda = new lambda.Function(stack, checkMissingStatesId, lambdaConf);
    const rule = new events.Rule(stack, 'Rule', {
        schedule: events.Schedule.expression('cron(0 2 * * ? *)')
    });
    rule.addTarget(new targets.LambdaFunction(checkMissingStatesLambda));

    return checkMissingStatesId;
}

function createUpdateServicesLambda(
    orphanRequestsFoundTopic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct): string {

    const updateServicesId = 'UpdateServices';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateServicesId,
        code: new lambda.AssetCode('dist/lambda/update-services'),
        handler: 'lambda-update-services.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_USER = props.integration.username;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_PASS = props.integration.password;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_URL = props.integration.url;
    const updateServicesLambda = new lambda.Function(stack, updateServicesId, lambdaConf);
    orphanRequestsFoundTopic.addSubscription(new subscriptions.LambdaSubscription(updateServicesLambda));

    return updateServicesId;
}

function createUpdateStatesLambda(
    topic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct): string {

    const updateStatesId = 'UpdateStates';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateStatesId,
        code: new lambda.AssetCode('dist/lambda/update-states'),
        handler: 'lambda-update-states.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_USER = props.integration.username;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_PASS = props.integration.password;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_URL = props.integration.url;
    const updateServicesLambda = new lambda.Function(stack, updateStatesId, lambdaConf);
    topic.addSubscription(new subscriptions.LambdaSubscription(updateServicesLambda));

    return updateStatesId;
}
