import * as lambda from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Construct, Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createSubscription} from '../../../common/stack/subscription';
import {AppProps} from "./app-props";
import {Queue} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {Bucket} from "@aws-cdk/aws-s3";
import {BUCKET_NAME} from "./lambda/process-dlq/lambda-process-dlq";
import {RetentionDays} from '@aws-cdk/aws-logs';
import {QueueAndDLQ} from "./sqs";
import {ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import * as cloudwatch from "@aws-cdk/aws-cloudwatch";
import {Topic} from "@aws-cdk/aws-sns";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {getFullEnv} from "../../../common/stack/stack-util";

export function createProcessQueueAndDlqLambda(
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    sqsExtendedMessageBucketArn: string,
    props: AppProps,
    stack: Stack) {
    createProcessQueueLambda(queueAndDLQ.queue, vpc, lambdaDbSg, dlqBucket.urlForObject(), sqsExtendedMessageBucketArn, props, stack);
    createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, props, stack);
}

function createProcessQueueLambda(
    queue: Queue,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    dlqBucketUrl: string,
    sqsExtendedMessageBucketArn: string,
    appProps: AppProps,
    stack: Stack) {

    const role = createLambdaRoleWithReadS3Policy(stack, sqsExtendedMessageBucketArn);
    const functionName = "MaintenanceTracking-ProcessQueue";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, appProps, {
        functionName: functionName,
        code: new lambda.AssetCode('dist/lambda/process-queue'),
        handler: 'lambda-process-queue.handler',
        environment: {
            DB_USER: appProps.dbProps?.username,
            DB_PASS: appProps.dbProps?.password,
            DB_URI: appProps.dbProps?.uri,
            SQS_BUCKET_NAME: appProps.sqsExtendedMessageBucketName,
            SQS_QUEUE_URL: queue.queueUrl
        },
        // reservedConcurrentExecutions: appProps.sqsProcessLambdaConcurrentExecutions,
        role: role,
        memorySize: 256
    });
    const processQueueLambda = new lambda.Function(stack, functionName, lambdaConf);
    // Handle only one message per time
    processQueueLambda.addEventSource(new SqsEventSource(queue, {
        batchSize: 1
    }));

    createSubscription(processQueueLambda, functionName, appProps.logsDestinationArn, stack);
    createAlarm(processQueueLambda, appProps.errorNotificationSnsTopicArn, appProps.dlqBucketName, stack);
}

function createAlarm(processQueueLambda: lambda.Function, errorNotificationSnsTopicArn: string, dlqBucketName: string, stack: Stack) {
    const fullEnv = getFullEnv(stack);
    // Raise an alarm if we have more than 1 errors in last minute
    const topic = Topic.fromTopicArn(stack, 'MaintenanceTrackingAlarmProcessQueueErrorTopic', errorNotificationSnsTopicArn)
    new cloudwatch.Alarm(stack, "MaintenanceTrackingAlarm", {
        alarmName: processQueueLambda.functionName + '-ErrorAlert-' + fullEnv,
        alarmDescription: `Environment: ${fullEnv}. Error in handling of maintenance tracking message. Check DLQ and ` +
                          `S3: https://s3.console.aws.amazon.com/s3/buckets/${dlqBucketName}?region=${stack.region} for failed tracking messages.`,
        metric: processQueueLambda.metricErrors().with({ period: Duration.days(1) }),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
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
    const processDLQLambda = new lambda.Function(stack, functionName, {
        runtime: lambda.Runtime.NODEJS_12_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new lambda.AssetCode('dist/lambda/process-dlq'),
        handler: 'lambda-process-dlq.handler',
        environment: lambdaEnv,
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions,
        memorySize: 256
    });

    processDLQLambda.addEventSource(new SqsEventSource(dlq));

    createSubscription(processDLQLambda, functionName, props.logsDestinationArn, stack);

    const statement = new PolicyStatement();
    statement.addActions('s3:PutObject');
    statement.addActions('s3:PutObjectAcl');
    statement.addResources(dlqBucket.bucketArn + '/*');
    processDLQLambda.addToRolePolicy(statement);
}

function createLambdaRoleWithReadS3Policy(stack: Construct, sqsExtendedMessageBucketArn: string) : Role {
    const lambdaRole = new Role(stack, `ReadSqsExtendedMessageBucketRole`, {
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
        roleName: `ReadSqsExtendedMessageBucketRole`
    });

    const s3PolicyStatement = new PolicyStatement();
    s3PolicyStatement.addActions('s3:GetObject'); // Read big messages from S3
    s3PolicyStatement.addActions('s3:DeleteObject'); // Delete handled big messages from S3
    s3PolicyStatement.addResources(sqsExtendedMessageBucketArn + '/*');

    lambdaRole.addToPolicy(s3PolicyStatement);
    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
    return lambdaRole;
}