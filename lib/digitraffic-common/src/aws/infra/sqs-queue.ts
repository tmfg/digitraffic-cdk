import { Duration } from "aws-cdk-lib";
import {
  ComparisonOperator,
  TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { QueueProps } from "aws-cdk-lib/aws-sqs";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
// getDlqCode and sanitizeS3BucketName live in a separate internal module so they
// are not part of the public API surface exported from this package.
// Tests can import them directly from sqs-queue-internal.ts.
import { getDlqCode, sanitizeS3BucketName } from "./sqs-queue-internal.js";
import { createLambdaLogGroup } from "./stack/lambda-log-group.js";
import { MonitoredFunction } from "./stack/monitoredfunction.js";
import type { DigitrafficStack } from "./stack/stack.js";

/**
 * Construct for creating SQS-queues.
 *
 * If you don't config your own deadLetterQueue, this will create a dlq for you, also a lambda function, a s3 bucket
 * and an alarm for the queue.  Anything that goes to the dlq will be written into the bucket and the alarm is activated.
 */
export class DigitrafficSqsQueue extends Queue {
  static create(
    stack: DigitrafficStack,
    name: string,
    props: QueueProps,
  ): DigitrafficSqsQueue {
    const queueName = `${stack.configuration.shortName}-${name}-Queue`;
    const queueProps = {
      ...props,
      encryption: QueueEncryption.KMS_MANAGED,
      queueName,
      deadLetterQueue: props.deadLetterQueue ?? {
        maxReceiveCount: 2,
        queue: DigitrafficDLQueue.create(stack, name),
      },
    };

    return new DigitrafficSqsQueue(stack, queueName, queueProps);
  }

  /**
   * Create a fifo with given name.  No DLQ created!
   */
  static createFifo(
    stack: DigitrafficStack,
    name: string,
    props: QueueProps,
  ): DigitrafficSqsQueue {
    const queueName = `${stack.configuration.shortName}-${name}-Queue.fifo`;
    const queueProps = {
      ...props,
      encryption: QueueEncryption.KMS_MANAGED,
      queueName,
    };

    return new DigitrafficSqsQueue(stack, queueName, queueProps);
  }
}

export const DigitrafficDLQueue = {
  create(stack: DigitrafficStack, name: string): DigitrafficSqsQueue {
    const dlqName = `${stack.configuration.shortName}-${name}-DLQ`;
    const dlqFunctionName = `${dlqName}-Function`;

    const dlq = new DigitrafficSqsQueue(stack, dlqName, {
      queueName: dlqName,
      visibilityTimeout: Duration.seconds(60),
      encryption: QueueEncryption.KMS_MANAGED,
    });

    const dlqBucket = new Bucket(stack, `${dlqName}-Bucket`, {
      bucketName: sanitizeS3BucketName(`${stack.stackName}-${dlqName}`),
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const dlqLogGroup = createLambdaLogGroup({
      stack,
      functionName: dlqFunctionName,
    });

    const lambda = MonitoredFunction.create(stack, dlqFunctionName, {
      runtime: Runtime.NODEJS_24_X,
      logGroup: dlqLogGroup,
      functionName: dlqFunctionName,
      code: getDlqCode(dlqBucket.bucketName),
      timeout: Duration.seconds(10),
      handler: "index.handler",
      memorySize: 128,
      reservedConcurrentExecutions: 1,
    });

    const statement = new PolicyStatement();
    statement.addActions("s3:PutObject");
    statement.addActions("s3:PutObjectAcl");
    statement.addResources(`${dlqBucket.bucketArn}/*`);

    lambda.addToRolePolicy(statement);
    lambda.addEventSource(new SqsEventSource(dlq));

    addDLQAlarm(stack, dlqName, dlq);

    return dlq;
  },
};

function addDLQAlarm(
  stack: DigitrafficStack,
  dlqName: string,
  dlq: Queue,
): void {
  const alarmName = `${dlqName}-Alarm`;
  dlq
    .metricNumberOfMessagesReceived({
      period: Duration.minutes(5),
    })
    .createAlarm(stack, alarmName, {
      alarmName,
      threshold: 0,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    })
    .addAlarmAction(new SnsAction(stack.warningTopic));
}
