import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Stack} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../../../common/stack/lambda-configs';
import {createSubscription} from '../../../../common/stack/subscription';
import {Props} from "./app-props-subscriptions";
import {SnsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {Topic} from "@aws-cdk/aws-sns";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack) {
    const topicName = 'PortcallEstimateSubscriptions-IncomingSMS';
    const incomingSmsTopic = new Topic(stack, topicName, {
        topicName
    });
    createSubscriptionCreatorLambda(incomingSmsTopic, vpc, lambdaDbSg, props, stack);
}

function createSubscriptionCreatorLambda(
    incomingSmsTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack) {
    const functionName = "PortcallEstimateSubscriptions-CreateSubscription";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/subscriptions/lambda/create-subscription'),
        handler: 'lambda-create-subscription.handler',
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri
        },
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
    });
    const subscriptionCreatorLambda = new Function(stack, functionName, lambdaConf);
    subscriptionCreatorLambda.addEventSource(new SnsEventSource(incomingSmsTopic));
    createSubscription(subscriptionCreatorLambda, functionName, props.logsDestinationArn, stack);
}
