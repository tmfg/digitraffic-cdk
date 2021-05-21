import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {IVpc} from '@aws-cdk/aws-ec2';
import {Duration, Stack} from '@aws-cdk/core';
import {defaultLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {Topic} from "@aws-cdk/aws-sns";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {VoyagePlanGatewayProps} from "./app-props";
import {VoyagePlanEnvKeys} from "./keys";
import {Queue} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";

export function create(
    secret: ISecret,
    notifyTopic: Topic,
    vpc: IVpc,
    props: VoyagePlanGatewayProps,
    stack: Stack) {

    const sendRouteQueueName = 'VPGW-SendRouteQueue.fifo';
    const sendRouteQueue = new Queue(stack, sendRouteQueueName, {
        queueName: sendRouteQueueName,
        visibilityTimeout: Duration.seconds(60),
        fifo: true // prevent sending route plans twice
    });

    createProcessVisMessagesLambda(secret, notifyTopic, sendRouteQueue, props, stack);
    createUploadVoyagePlanLambda(secret, sendRouteQueue, vpc, props, stack);
}

function createProcessVisMessagesLambda(
    secret: ISecret,
    notifyTopic: Topic,
    sendRouteQueue: Queue,
    props: VoyagePlanGatewayProps,
    stack: Stack) {

    const functionName = "VPGW-ProcessVisMessages";
    const environment = {} as any;
    environment[VoyagePlanEnvKeys.SECRET_ID] = props.secretId;
    environment[VoyagePlanEnvKeys.QUEUE_URL] = sendRouteQueue.queueUrl;
    const lambdaConf = defaultLambdaConfiguration({
        functionName: functionName,
        memorySize: 128,
        code: new AssetCode('dist/lambda/process-vis-messages'),
        handler: 'lambda-process-vis-messages.handler',
        environment
    });
    const lambda = new Function(stack, functionName, lambdaConf);
    secret.grantRead(lambda);
    notifyTopic.addSubscription(new LambdaSubscription(lambda));
    sendRouteQueue.grantSendMessages(lambda);
    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}

// ATTENTION!
// This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
// The reason for this is IP based restriction in another system's firewall.
function createUploadVoyagePlanLambda(
    secret: ISecret,
    sendRouteQueue: Queue,
    vpc: IVpc,
    props: VoyagePlanGatewayProps,
    stack: Stack) {

    const functionName = "VPGW-UploadVoyagePlan";
    const environment = {} as any;
    environment[VoyagePlanEnvKeys.SECRET_ID] = props.secretId;
    const lambdaConf = defaultLambdaConfiguration({
        functionName: functionName,
        memorySize: 128,
        code: new AssetCode('dist/lambda/upload-voyage-plan'),
        handler: 'lambda-upload-voyage-plan.handler',
        vpc: vpc,
        environment
    });
    const lambda = new Function(stack, functionName, lambdaConf);
    secret.grantRead(lambda);
    lambda.addEventSource(new SqsEventSource(sendRouteQueue));
    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}
