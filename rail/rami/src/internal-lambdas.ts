import {
    MonitoredDBFunction,
    MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { Queue } from "aws-cdk-lib/aws-sqs";
import { RamiEnvKeys } from "./keys.js";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { Duration } from "aws-cdk-lib";

export function create(stack: DigitrafficStack, rosmSqs: Queue, smSqs: Queue, udotSqs: Queue, dlq: Queue, dlqBucketName: string): void {
    const dlqBucket = createDLQBucket(stack, dlqBucketName);
    createProcessRosmQueueLambda(stack, rosmSqs, dlq);
    createProcessSmQueueLambda(stack, smSqs, udotSqs, dlq);
    createProcessUdotQueueLambda(stack, udotSqs, dlq);
    createProcessDLQLambda(stack, dlq, dlqBucket);

    createDeleteOldDataLambda(stack);
}

function createDLQBucket(stack: DigitrafficStack, bucketName: string): Bucket {
    return new Bucket(stack, "DLQBucket", {
        bucketName,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });
}

function createProcessRosmQueueLambda(stack: DigitrafficStack, queue: Queue, dlq: Queue): MonitoredFunction {
    const lambdaEnv = {
        ...(stack.configuration.secretId && { SECRET_ID: stack.configuration.secretId }),
        DB_APPLICATION: "avoindata",
        [RamiEnvKeys.DLQ_URL]: dlq.queueUrl
    };
    const processQueueLambda = MonitoredDBFunction.create(stack, "process-rosm-queue", lambdaEnv, {
        memorySize: 256,
        reservedConcurrentExecutions: 10,
        timeout: 10
    });
    processQueueLambda.addEventSource(new SqsEventSource(queue, {reportBatchItemFailures: true}));
    dlq.grantSendMessages(processQueueLambda);

    return processQueueLambda;
}

function createProcessSmQueueLambda(stack: DigitrafficStack, smQueue: Queue, udotQueue: Queue, dlq: Queue): MonitoredFunction {
    const lambdaEnv = {
        ...(stack.configuration.secretId && { SECRET_ID: stack.configuration.secretId }),
        DB_APPLICATION: "avoindata",
        [RamiEnvKeys.DLQ_URL]: dlq.queueUrl,
        [RamiEnvKeys.UDOT_SQS_URL]: udotQueue.queueUrl
    };

    const processQueueLambda = MonitoredDBFunction.create(stack, "process-sm-queue", lambdaEnv, {
        memorySize: 256,
        reservedConcurrentExecutions: 6,
        timeout: 10
    });
    processQueueLambda.addEventSource(new SqsEventSource(smQueue, {reportBatchItemFailures: true}));
    dlq.grantSendMessages(processQueueLambda);
    udotQueue.grantSendMessages(processQueueLambda);

    return processQueueLambda;
}

function createProcessUdotQueueLambda(stack: DigitrafficStack, queue: Queue, dlq: Queue): MonitoredFunction {
    const lambdaEnv = {
        ...(stack.configuration.secretId && { SECRET_ID: stack.configuration.secretId }),
        DB_APPLICATION: "avoindata",
        [RamiEnvKeys.DLQ_URL]: dlq.queueUrl
    };
    const processQueueLambda = MonitoredDBFunction.create(stack, "process-udot-queue", lambdaEnv, {
        memorySize: 256,
        reservedConcurrentExecutions: 2,
        timeout: 10
    });
    processQueueLambda.addEventSource(new SqsEventSource(queue, {
        reportBatchItemFailures: true,
        batchSize: 30,
        maxBatchingWindow: Duration.seconds(5),
        maxConcurrency: 2
    }));
    dlq.grantSendMessages(processQueueLambda);
    return processQueueLambda;
}

function createDeleteOldDataLambda(stack: DigitrafficStack): MonitoredFunction {
    const lambdaEnv = {
        ...(stack.configuration.secretId && { SECRET_ID: stack.configuration.secretId }),
        DB_APPLICATION: "avoindata",
    };
    const deleteOldDataLambda = MonitoredDBFunction.create(stack, "delete-old-data", lambdaEnv, {
        memorySize: 128,
        reservedConcurrentExecutions: 1,
        timeout: 10
    });

    Scheduler.everyDay(stack, "schedule-every-day", deleteOldDataLambda);

    return deleteOldDataLambda;
}

function createProcessDLQLambda(stack: DigitrafficStack, dlq: Queue, dlqBucket: Bucket): MonitoredFunction {
    const lambdaEnv = {
        [RamiEnvKeys.SQS_DLQ_BUCKET_NAME]: dlqBucket.bucketName
    };

    const processDLQLambda = MonitoredFunction.createV2(stack, "process-dlq", lambdaEnv, {
        reservedConcurrentExecutions: 5,
        timeout: 10,
        memorySize: 256,
        runtime: Runtime.NODEJS_20_X
    });

    processDLQLambda.addEventSource(new SqsEventSource(dlq));

    const statement = new PolicyStatement();
    statement.addActions("s3:PutObject");
    statement.addActions("s3:PutObjectAcl");
    statement.addResources(dlqBucket.bucketArn + "/*");
    processDLQLambda.addToRolePolicy(statement);

    return processDLQLambda;
}
