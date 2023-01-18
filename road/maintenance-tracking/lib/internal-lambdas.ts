import * as lambda from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { Construct } from "constructs";
import {
    databaseFunctionProps,
    LambdaEnvironment,
} from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { createSubscription } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { AppProps } from "./app-props";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { QueueAndDLQ } from "./sqs";
import {
    ManagedPolicy,
    PolicyStatement,
    Role,
    ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { MaintenanceTrackingEnvKeys } from "./keys";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";

export function createCleanMaintenanceTrackingDataLambda(
    stack: DigitrafficStack
): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();

    const lambdaFunction = MonitoredDBFunction.create(
        stack,
        "clean-maintenance-tracking-data",
        environment,
        {
            functionName:
                stack.configuration.shortName + "-cleanMaintenanceTrackingData",
            memorySize: 128,
        }
    );

    Scheduler.everyHour(
        stack,
        `MaintenanceTracking-cleanMaintenanceTrackingDataEveryHour`,
        lambdaFunction
    );

    return lambdaFunction;
}

export function createProcessQueueAndDlqLambda(
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket,
    sqsExtendedMessageBucketArn: string,
    props: AppProps,
    stack: DigitrafficStack
) {
    createProcessQueueLambda(
        queueAndDLQ.queue,
        dlqBucket.urlForObject(),
        sqsExtendedMessageBucketArn,
        props,
        stack
    );
    createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, props, stack);
}

function createProcessQueueLambda(
    queue: Queue,
    dlqBucketUrl: string,
    sqsExtendedMessageBucketArn: string,
    appProps: AppProps,
    stack: DigitrafficStack
) {
    const role = createLambdaRoleWithReadS3Policy(
        stack,
        sqsExtendedMessageBucketArn
    );
    const functionName = "MaintenanceTracking-ProcessQueue";
    const secret = stack.secret;

    const env: LambdaEnvironment = {};
    env[MaintenanceTrackingEnvKeys.SECRET_ID] =
        appProps.secretId == undefined ? "" : appProps.secretId;
    env[MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME] =
        appProps.sqsMessageBucketName;
    env[MaintenanceTrackingEnvKeys.SQS_QUEUE_URL] = queue.queueUrl;

    const lambdaConf = databaseFunctionProps(
        stack,
        env,
        functionName,
        "process-queue",
        {
            reservedConcurrentExecutions: 100,
            timeout: 60,
            role: role,
            memorySize: 256,
        }
    );
    const processQueueLambda = MonitoredFunction.create(
        stack,
        functionName,
        lambdaConf
    );
    // Handle only one message per time
    processQueueLambda.addEventSource(
        new SqsEventSource(queue, {
            batchSize: 1,
        })
    );
    secret?.grantRead(processQueueLambda);
    createSubscription(
        processQueueLambda,
        functionName,
        appProps.logsDestinationArn,
        stack
    );
}

function createProcessDLQLambda(
    dlqBucket: Bucket,
    dlq: Queue,
    props: AppProps,
    stack: DigitrafficStack
) {
    const lambdaEnv: LambdaEnvironment = {};
    lambdaEnv[MaintenanceTrackingEnvKeys.SQS_DLQ_BUCKET_NAME] =
        dlqBucket.bucketName;
    const functionName = "MaintenanceTracking-ProcessDLQ";

    const processDLQLambda = MonitoredFunction.create(stack, functionName, {
        runtime: lambda.Runtime.NODEJS_16_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new lambda.AssetCode("dist/lambda/process-dlq"),
        handler: "process-dlq.handler",
        environment: lambdaEnv,
        reservedConcurrentExecutions: 1,
        timeout: Duration.seconds(10),
        memorySize: 256,
    });

    processDLQLambda.addEventSource(new SqsEventSource(dlq));

    createSubscription(
        processDLQLambda,
        functionName,
        props.logsDestinationArn,
        stack
    );

    const statement = new PolicyStatement();
    statement.addActions("s3:PutObject");
    statement.addActions("s3:PutObjectAcl");
    statement.addResources(dlqBucket.bucketArn + "/*");
    processDLQLambda.addToRolePolicy(statement);
}

function createLambdaRoleWithReadS3Policy(
    stack: Construct,
    sqsExtendedMessageBucketArn: string
): Role {
    const lambdaRole = new Role(stack, `ReadSqsExtendedMessageBucketRole`, {
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
        roleName: `ReadSqsExtendedMessageBucketRole`,
    });

    const s3PolicyStatement = new PolicyStatement();
    s3PolicyStatement.addActions("s3:GetObject"); // Read big messages from S3
    s3PolicyStatement.addActions("s3:DeleteObject"); // Delete handled big messages from S3
    s3PolicyStatement.addResources(sqsExtendedMessageBucketArn + "/*");

    lambdaRole.addToPolicy(s3PolicyStatement);
    lambdaRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
        )
    );
    lambdaRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaVPCAccessExecutionRole"
        )
    );
    return lambdaRole;
}
