import { DigitrafficSqsQueue } from "@digitraffic/common/dist/aws/infra/sqs-queue.js";
import {
    MonitoredDBFunction,
    MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction.js";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack.js";
import { Duration } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { RamiEnvKeys } from "./keys.js";

export function create(stack: DigitrafficStack, dlqBucketName: string): void {
    const dlq = createDLQ(stack);
    const sqs = createSQS(stack, dlq);
    const dlqBucket = createDLQBucket(stack, dlqBucketName);
    createProcessQueueLambda(stack, sqs);
    createProcessDLQLambda(stack, sqs, dlqBucket);
}

function createSQS(stack: DigitrafficStack, dlq: Queue): DigitrafficSqsQueue {
    return DigitrafficSqsQueue.create(stack, "SQS", {
        receiveMessageWaitTime: Duration.seconds(5),
        visibilityTimeout: Duration.seconds(60),
        deadLetterQueue: { queue: dlq, maxReceiveCount: 2 }
    });
}

function createDLQ(stack: DigitrafficStack): Queue {
    const dlqName = "RAMI-DLQ";
    return new Queue(stack, dlqName, {
        queueName: dlqName,
        receiveMessageWaitTime: Duration.seconds(20),
        encryption: QueueEncryption.KMS_MANAGED
    });
}

function createDLQBucket(stack: DigitrafficStack, bucketName: string): Bucket {
    return new Bucket(stack, "DLQBucket", {
        bucketName,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });
}

function createProcessQueueLambda(stack: DigitrafficStack, queue: Queue): MonitoredFunction {
    const lambdaEnv = {
        ...(stack.configuration.secretId && { SECRET_ID: stack.configuration.secretId }),
        DB_APPLICATION: "avoindata"
    };
    const processQueueLambda = MonitoredDBFunction.create(stack, "process-queue", lambdaEnv, {
        memorySize: 256,
        reservedConcurrentExecutions: 5,
        timeout: 10
    });
    processQueueLambda.addEventSource(new SqsEventSource(queue));
    return processQueueLambda;
}

function createProcessDLQLambda(stack: DigitrafficStack, dlq: Queue, dlqBucket: Bucket): MonitoredFunction {
    const lambdaEnv = {
        [RamiEnvKeys.SQS_DLQ_BUCKET_NAME]: dlqBucket.bucketName
    };

    const processDLQLambda = MonitoredFunction.createV2(stack, "process-dlq", lambdaEnv, {
        reservedConcurrentExecutions: 1,
        timeout: 10,
        memorySize: 256,
        runtime: Runtime.NODEJS_16_X
    });

    processDLQLambda.addEventSource(new SqsEventSource(dlq));

    const statement = new PolicyStatement();
    statement.addActions("s3:PutObject");
    statement.addActions("s3:PutObjectAcl");
    statement.addResources(dlqBucket.bucketArn + "/*");
    processDLQLambda.addToRolePolicy(statement);

    return processDLQLambda;
}
