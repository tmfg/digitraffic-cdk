import {
  MonitoredDBFunction,
  MonitoredFunction,
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { Queue } from "aws-cdk-lib/aws-sqs";
import { RamiEnvKeys } from "./keys.js";

export function create(
  stack: DigitrafficStack,
  sqs: Queue,
  dlq: Queue,
  dlqBucketName: string,
): void {
  const dlqBucket = createDLQBucket(stack, dlqBucketName);
  createProcessQueueLambda(stack, sqs, dlq);
  createProcessDLQLambda(stack, dlq, dlqBucket);
}

function createDLQBucket(stack: DigitrafficStack, bucketName: string): Bucket {
  return new Bucket(stack, "DLQBucket", {
    bucketName,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  });
}

function createProcessQueueLambda(
  stack: DigitrafficStack,
  queue: Queue,
  dlq: Queue,
): MonitoredFunction {
  const lambdaEnv = {
    ...(stack.configuration.secretId &&
      { SECRET_ID: stack.configuration.secretId }),
    DB_APPLICATION: "avoindata",
    DLQ_URL: dlq.queueUrl,
  };
  const processQueueLambda = MonitoredDBFunction.create(
    stack,
    "process-queue",
    lambdaEnv,
    {
      memorySize: 256,
      reservedConcurrentExecutions: 10,
      timeout: 10,
    },
  );
  processQueueLambda.addEventSource(new SqsEventSource(queue));
  dlq.grantSendMessages(processQueueLambda);
  return processQueueLambda;
}

function createProcessDLQLambda(
  stack: DigitrafficStack,
  dlq: Queue,
  dlqBucket: Bucket,
): MonitoredFunction {
  const lambdaEnv = {
    [RamiEnvKeys.SQS_DLQ_BUCKET_NAME]: dlqBucket.bucketName,
  };

  const processDLQLambda = MonitoredFunction.createV2(
    stack,
    "process-dlq",
    lambdaEnv,
    {
      reservedConcurrentExecutions: 5,
      timeout: 10,
      memorySize: 256,
      runtime: Runtime.NODEJS_20_X,
    },
  );

  processDLQLambda.addEventSource(new SqsEventSource(dlq));

  const statement = new PolicyStatement();
  statement.addActions("s3:PutObject");
  statement.addActions("s3:PutObjectAcl");
  statement.addResources(dlqBucket.bucketArn + "/*");
  processDLQLambda.addToRolePolicy(statement);

  return processDLQLambda;
}
