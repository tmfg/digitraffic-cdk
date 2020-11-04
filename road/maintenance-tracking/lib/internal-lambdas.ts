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
import * as cloudwatch from "@aws-cdk/aws-cloudwatch";
import {Topic} from "@aws-cdk/aws-sns";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {getFullEnv} from "../../../common/stack/stack-util";

export function create(
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AppProps,
    stack: Stack) {
    createProcessQueueLambda(queueAndDLQ.queue, vpc, lambdaDbSg, dlqBucket.urlForObject(), props, stack);
    createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, props, stack);
}

function createProcessQueueLambda(
    queue: Queue,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    dlqBucketUrl: string,
    appProps: AppProps,
    stack: Stack) {
    const functionName = "MaintenanceTracking-ProcessQueue";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, appProps, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/process-queue'),
        handler: 'lambda-process-queue.handler',
        environment: {
            DB_USER: appProps.dbProps.username,
            DB_PASS: appProps.dbProps.password,
            DB_URI: appProps.dbProps.uri
        },
        reservedConcurrentExecutions: appProps.sqsProcessLambdaConcurrentExecutions
    });
    const processQueueLambda = new Function(stack, functionName, lambdaConf);
    processQueueLambda.addEventSource(new SqsEventSource(queue));
    createSubscription(processQueueLambda, functionName, appProps.logsDestinationArn, stack);
    createAlarm(processQueueLambda, appProps.errorNotificationSnsTopicArn, appProps.dlqBucketName, stack);
}

function createAlarm(processQueueLambda: Function, errorNotificationSnsTopicArn: string, dlqBucketName: string, stack: Stack) {
    const lambdaMetric = processQueueLambda.metricErrors();
    const fullEnv = getFullEnv(stack);
    // Raise an alarm if we have more than 1 errors in last minute
    const topic = Topic.fromTopicArn(stack, 'Topic', errorNotificationSnsTopicArn)
    new cloudwatch.Alarm(stack, "MaintenanceTrackingAlarm", {
        alarmName: processQueueLambda.functionName + '-ErrorAlert-' + fullEnv,
        alarmDescription: `Environment: ${fullEnv}. Error in handling of maintenance tracking message. Check DLQ and ` +
                          `S3: https://s3.console.aws.amazon.com/s3/buckets/${dlqBucketName}?region=${stack.region} for failed tracking messages.`,
        metric: lambdaMetric,
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1
    }).addAlarmAction(new SnsAction(topic));
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
