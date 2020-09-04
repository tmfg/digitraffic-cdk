import * as events from '@aws-cdk/aws-events';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as targets from '@aws-cdk/aws-events-targets';
import {Construct} from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import {dbLambdaConfiguration} from '../../common/stack/lambda-configs';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
import {createSubscription} from "../../common/stack/subscription";

// returns lambda names for log group subscriptions
export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct,
    props: Props) {

    const orphanRequestsFoundTopic = new sns.Topic(stack, 'OrphanRequestsFoundTopic', {
        displayName: 'OrphanRequestsFoundTopic'
    });
    const missingStatesLambdaTopic = new sns.Topic(stack, 'MissingStatesFoundTopic', {
        displayName: 'MissingStatesFoundTopic'
    });
    createCheckOrphanRequestsLambda(orphanRequestsFoundTopic, vpc, lambdaDbSg, props, stack);
    createCheckMissingStatesLambda(missingStatesLambdaTopic, vpc, lambdaDbSg, props, stack);
    createUpdateServicesLambda(orphanRequestsFoundTopic, vpc, lambdaDbSg, props, stack);
    createUpdateStatesLambda(missingStatesLambdaTopic, vpc, lambdaDbSg, props, stack);
}

function createCheckOrphanRequestsLambda(
    orphanRequestsFoundTopic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct) {

    const checkOrphanRequestsId = 'CheckOrphanRequests';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: checkOrphanRequestsId,
        code: new lambda.AssetCode('dist/lambda/check-orphan-requests'),
        handler: 'lambda-check-orphan-requests.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ORPHAN_SNS_TOPIC_ARN = orphanRequestsFoundTopic.topicArn;
    const checkOrphansLambda = new lambda.Function(stack, checkOrphanRequestsId, lambdaConf);
    orphanRequestsFoundTopic.grantPublish(checkOrphansLambda);
    createSubscription(checkOrphansLambda, checkOrphanRequestsId, props.logsDestinationArn, stack);
    const rule = new events.Rule(stack, 'CheckOrphanRequestsScheduleRule', {
        schedule: events.Schedule.expression('cron(0 2 * * ? *)')
    });
    rule.addTarget(new targets.LambdaFunction(checkOrphansLambda));
}

function createCheckMissingStatesLambda(
    topic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct) {

    const checkMissingStatesId = 'CheckMissingStates';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: checkMissingStatesId,
        code: new lambda.AssetCode('dist/lambda/check-missing-states'),
        handler: 'lambda-check-missing-states.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ORPHAN_SNS_TOPIC_ARN = topic.topicArn;
    const checkMissingStatesLambda = new lambda.Function(stack, checkMissingStatesId, lambdaConf);
    topic.grantPublish(checkMissingStatesLambda);
    createSubscription(checkMissingStatesLambda, checkMissingStatesId, props.logsDestinationArn, stack);
    const rule = new events.Rule(stack, 'CheckMissingStatesScheduleRule', {
        schedule: events.Schedule.expression('cron(0 2 * * ? *)')
    });
    rule.addTarget(new targets.LambdaFunction(checkMissingStatesLambda));
}

function createUpdateServicesLambda(
    orphanRequestsFoundTopic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct) {

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
    createSubscription(updateServicesLambda, updateServicesId, props.logsDestinationArn, stack);
    orphanRequestsFoundTopic.addSubscription(new subscriptions.LambdaSubscription(updateServicesLambda));
}

function createUpdateStatesLambda(
    topic: sns.Topic,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct) {

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
    const updateStatesLambda = new lambda.Function(stack, updateStatesId, lambdaConf);
    createSubscription(updateStatesLambda, updateStatesId, props.logsDestinationArn, stack);
    topic.addSubscription(new subscriptions.LambdaSubscription(updateStatesLambda));
}
