import {Function,AssetCode,Runtime} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {Stack} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createSubscription} from '../../../common/stack/subscription';
import {AppProps} from "./app-props";
import {Queue} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {Bucket} from "@aws-cdk/aws-s3";
import {BUCKET_NAME} from "./lambda/process-dlq/lambda-process-dlq";
import {RetentionDays} from '@aws-cdk/aws-logs';
import {QueueAndDLQ} from "./sqs";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {Topic} from "@aws-cdk/aws-sns";

export function create(
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AppProps,
    stack: Stack) {
    const trackingsUpdatedTopicId = 'MaintenanceTrackingUpdatedTopic';
    const trackingsUpdatedTopic = new Topic(stack, trackingsUpdatedTopicId, {
        displayName: trackingsUpdatedTopicId,
        topicName: trackingsUpdatedTopicId
    });
    createProcessQueueLambda(queueAndDLQ.queue, trackingsUpdatedTopic, vpc, lambdaDbSg, props, stack);
    createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, props, stack);
}

function createProcessQueueLambda(
    queue: Queue,
    trackingsUpdatedTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AppProps,
    stack: Stack) {
    const functionName = "MaintenanceTracking-ProcessQueue";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/process-queue'),
        handler: 'lambda-process-queue.handler',
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri,
            MAINTENANCE_TRACKING_SNS_TOPIC_ARN: trackingsUpdatedTopic.topicArn
        },
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
    });
    const processQueueLambda = new Function(stack, functionName, lambdaConf);
    processQueueLambda.addEventSource(new SqsEventSource(queue));
    trackingsUpdatedTopic.grantPublish(processQueueLambda); // Creates IAM role
    createSubscription(processQueueLambda, functionName, props.logsDestinationArn, stack);
}

function createProcessDLQLambda(
    dlqBucket: Bucket,
    dlq: Queue,
    props: AppProps,
    stack: Stack) {
    const lambdaEnv: any = {};
    lambdaEnv[BUCKET_NAME] = dlqBucket.bucketName;
    const functionName = "MaintenanceTracking-ProcessDLQ";
    const processDLQLambda = new Function(stack, functionName, {
        runtime: Runtime.NODEJS_12_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new AssetCode('dist/lambda/process-dlq'),
        handler: 'lambda-process-dlq.handler',
        environment: lambdaEnv,
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
    });

    processDLQLambda.addEventSource(new SqsEventSource(dlq));

    createSubscription(processDLQLambda, functionName, props.logsDestinationArn, stack);

    const statement = new PolicyStatement();
    statement.addActions('s3:PutObject');
    statement.addActions('s3:PutObjectAcl');
    statement.addResources(dlqBucket.bucketArn + '/*');
    processDLQLambda.addToRolePolicy(statement);
}
