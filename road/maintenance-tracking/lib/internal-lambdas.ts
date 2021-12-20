import * as lambda from 'aws-cdk-lib/aws-lambda';
import {Duration} from 'aws-cdk-lib';
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {Construct} from "constructs";
import {databaseFunctionProps} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {AppProps} from "./app-props";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {QueueAndDLQ} from "./sqs";
import {ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {MaintenanceTrackingEnvKeys} from "./keys";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";

export function createProcessQueueAndDlqLambda(
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket,
    sqsExtendedMessageBucketArn: string,
    props: AppProps,
    secret: ISecret,
    stack: DigitrafficStack,
) {
    createProcessQueueLambda(
        queueAndDLQ.queue, dlqBucket.urlForObject(), sqsExtendedMessageBucketArn, props, secret, stack,
    );
    createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, props, stack);
}

function createProcessQueueLambda(
    queue: Queue,
    dlqBucketUrl: string,
    sqsExtendedMessageBucketArn: string,
    appProps: AppProps,
    secret: ISecret,
    stack: DigitrafficStack,
) {

    const role = createLambdaRoleWithReadS3Policy(stack, sqsExtendedMessageBucketArn);
    const functionName = "MaintenanceTracking-ProcessQueue";

    const env: LambdaEnvironment = {};
    env[MaintenanceTrackingEnvKeys.SECRET_ID] = appProps.secretId;
    env[MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME] = appProps.sqsMessageBucketName;
    env[MaintenanceTrackingEnvKeys.SQS_QUEUE_URL] = queue.queueUrl;

    const lambdaConf = databaseFunctionProps(
        stack, env, functionName, 'process-queue', {
            reservedConcurrentExecutions: 100,
            timeout: 60,
            role: role,
            memorySize: 256,
        },
    );
    const processQueueLambda = MonitoredFunction.create(stack, functionName, lambdaConf);
    // Handle only one message per time
    processQueueLambda.addEventSource(new SqsEventSource(queue, {
        batchSize: 1,
    }));
    secret.grantRead(processQueueLambda);
    createSubscription(processQueueLambda, functionName, appProps.logsDestinationArn, stack);
}

function createProcessDLQLambda(dlqBucket: Bucket,
    dlq: Queue,
    props: AppProps,
    stack: DigitrafficStack) {
    const lambdaEnv: LambdaEnvironment = {};
    lambdaEnv[MaintenanceTrackingEnvKeys.SQS_DLQ_BUCKET_NAME] = dlqBucket.bucketName;
    const functionName = "MaintenanceTracking-ProcessDLQ";

    const processDLQLambda = MonitoredFunction.create(stack, functionName, {
        runtime: lambda.Runtime.NODEJS_14_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new lambda.AssetCode('dist/lambda/process-dlq'),
        handler: 'lambda-process-dlq.handler',
        environment: lambdaEnv,
        reservedConcurrentExecutions: 1,
        timeout: Duration.seconds(10),
        memorySize: 256,
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
        roleName: `ReadSqsExtendedMessageBucketRole`,
    });

    const s3PolicyStatement = new PolicyStatement();
    s3PolicyStatement.addActions('s3:GetObject'); // Read big messages from S3
    s3PolicyStatement.addActions('s3:DeleteObject'); // Delete handled big messages from S3
    s3PolicyStatement.addResources(sqsExtendedMessageBucketArn + '/*');

    lambdaRole.addToPolicy(s3PolicyStatement);
    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"));
    return lambdaRole;
}