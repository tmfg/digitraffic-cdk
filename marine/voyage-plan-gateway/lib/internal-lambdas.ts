import {AssetCode, Runtime} from '@aws-cdk/aws-lambda';
import {IVpc} from '@aws-cdk/aws-ec2';
import {Duration, Stack} from '@aws-cdk/core';
import {defaultLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription, DigitrafficLogSubscriptions} from 'digitraffic-common/stack/subscription';
import {Topic} from "@aws-cdk/aws-sns";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {VoyagePlanGatewayProps} from "./app-props";
import {VoyagePlanEnvKeys} from "./keys";
import {Queue, QueueEncryption} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {BlockPublicAccess, Bucket} from "@aws-cdk/aws-s3";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {ComparisonOperator, TreatMissingData} from "@aws-cdk/aws-cloudwatch";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export function create(
    secret: ISecret,
    notifyTopic: Topic,
    props: VoyagePlanGatewayProps,
    stack: DigitrafficStack) {

    const dlqBucket = new Bucket(stack, 'DLQBucket', {
        bucketName: props.dlqBucketName,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    const dlqQueueName = 'VPGW-SendRouteDLQ.fifo';
    const dlq = new Queue(stack, dlqQueueName, {
        queueName: dlqQueueName,
        receiveMessageWaitTime: Duration.seconds(20),
        encryption: QueueEncryption.KMS_MANAGED,
        fifo: true
    });

    const sendRouteQueueName = 'VPGW-SendRouteQueue.fifo';
    const sendRouteQueue = new Queue(stack, sendRouteQueueName, {
        queueName: sendRouteQueueName,
        visibilityTimeout: Duration.seconds(60),
        fifo: true, // prevent sending route plans twice
        deadLetterQueue: {
            maxReceiveCount: 3,
            queue: dlq
        }
    });

    const processVisMessagesLambda = createProcessVisMessagesLambda(
        secret,
        notifyTopic,
        sendRouteQueue,
        props,
        stack);
    const scheduler = createProcessVisMessagesScheduler(stack);
    scheduler.addTarget(new LambdaFunction(processVisMessagesLambda));

    createUploadVoyagePlanLambda(
        secret,
        sendRouteQueue,
        props,
        stack);
    createProcessDLQLambda(
        dlqBucket,
        dlq,
        props,
        stack);

    addDLQAlarm(dlq, props, stack);
}

function createProcessVisMessagesScheduler(stack: Stack): Rule {
    const ruleName = 'VPGW-ProcessVisMessagesScheduler'
    return new Rule(stack, ruleName, {
        ruleName,
        schedule: Schedule.expression('cron(*/1 * * * ? *)') // every 1 minutes
    });
}

function createProcessVisMessagesLambda(
    secret: ISecret,
    notifyTopic: Topic,
    sendRouteQueue: Queue,
    props: VoyagePlanGatewayProps,
    stack: DigitrafficStack) {

    const functionName = "VPGW-ProcessVisMessages";
    const environment = {} as any;
    environment[VoyagePlanEnvKeys.SECRET_ID] = props.secretId;
    environment[VoyagePlanEnvKeys.QUEUE_URL] = sendRouteQueue.queueUrl;
    const lambdaConf = defaultLambdaConfiguration({
        functionName: functionName,
        memorySize: 128,
        timeout: 10,
        reservedConcurrentExecutions: 2,
        code: new AssetCode('dist/lambda/process-vis-messages'),
        handler: 'lambda-process-vis-messages.handler',
        environment
    });
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf);
    secret.grantRead(lambda);
    notifyTopic.addSubscription(new LambdaSubscription(lambda));
    sendRouteQueue.grantSendMessages(lambda);
    createSubscription(lambda, functionName, props.logsDestinationArn, stack);

    return lambda;
}

// ATTENTION!
// This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
// The reason for this is IP based restriction in another system's firewall.
function createUploadVoyagePlanLambda(
    secret: ISecret,
    sendRouteQueue: Queue,
    props: VoyagePlanGatewayProps,
    stack: DigitrafficStack) {

    const functionName = "VPGW-UploadVoyagePlan";
    const environment = {} as any;
    environment[VoyagePlanEnvKeys.SECRET_ID] = props.secretId;
    const lambdaConf = defaultLambdaConfiguration({
        functionName: functionName,
        code: new AssetCode('dist/lambda/upload-voyage-plan'),
        handler: 'lambda-upload-voyage-plan.handler',
        timeout: 10,
        vpc: stack.vpc,
        environment
    });
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf);
    secret.grantRead(lambda);
    lambda.addEventSource(new SqsEventSource(sendRouteQueue, {
        batchSize: 1
    }));

    new DigitrafficLogSubscriptions(stack, lambda);
}

function createProcessDLQLambda(
    dlqBucket: Bucket,
    dlq: Queue,
    props: VoyagePlanGatewayProps,
    stack: DigitrafficStack) {

    const lambdaEnv: LambdaEnvironment = {};
    lambdaEnv[VoyagePlanEnvKeys.BUCKET_NAME] = dlqBucket.bucketName;
    const functionName = "VPGW-ProcessDLQ";
    const processDLQLambda = MonitoredFunction.create(stack, functionName, {
        runtime: Runtime.NODEJS_12_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new AssetCode('dist/lambda/process-dlq'),
        handler: 'lambda-process-dlq.handler',
        environment: lambdaEnv,
        timeout: Duration.seconds(10),
    });

    processDLQLambda.addEventSource(new SqsEventSource(dlq));
    createSubscription(processDLQLambda, functionName, props.logsDestinationArn, stack);

    const statement = new PolicyStatement();
    statement.addActions('s3:PutObject');
    statement.addActions('s3:PutObjectAcl');
    statement.addResources(dlqBucket.bucketArn + '/*');
    processDLQLambda.addToRolePolicy(statement);
}

function addDLQAlarm(
    queue: Queue,
    appProps: VoyagePlanGatewayProps,
    stack: DigitrafficStack) {
    
    const alarmName = 'VPGW-DLQAlarm';
    queue.metricNumberOfMessagesReceived({
        period: appProps.dlqNotificationDuration
    }).createAlarm(stack, alarmName, {
        alarmName,
        threshold: 0,
        evaluationPeriods: 1,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD
    }).addAlarmAction(new SnsAction(stack.warningTopic));
}
