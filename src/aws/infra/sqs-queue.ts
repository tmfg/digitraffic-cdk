import { Queue, QueueEncryption, type QueueProps } from "aws-cdk-lib/aws-sqs";
import { Duration } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { InlineCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import {
  ComparisonOperator,
  TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import type { SQSEvent, SQSHandler, SQSRecord } from "aws-lambda";
import type { DigitrafficStack } from "./stack/stack.js";
import { MonitoredFunction } from "./stack/monitoredfunction.js";
import {
  type ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { NodeJsRuntimeStreamingBlobPayloadInputTypes } from "@smithy/types";
import { logger } from "../runtime/dt-logger-default.js";
import { createLambdaLogGroup } from "./stack/lambda-log-group.js";

const DLQ_LAMBDA_CODE = `
import type { ObjectCannedACL } from "@aws-sdk/client-s3";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type NodeJsRuntimeStreamingBlobPayloadInputTypes } from "@smithy/types";
import { logger } from "./dt-logger-default.mjs";


const bucketName = "__bucketName__";

__upload__

exports.handler = async (event) => __handler__
` as const;

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
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
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

export class DigitrafficDLQueue {
  static create(stack: DigitrafficStack, name: string): DigitrafficSqsQueue {
    const dlqName = `${stack.configuration.shortName}-${name}-DLQ`;
    const dlqFunctionName = `${dlqName}-Function`;

    const dlq = new DigitrafficSqsQueue(stack, dlqName, {
      queueName: dlqName,
      visibilityTimeout: Duration.seconds(60),
      encryption: QueueEncryption.KMS_MANAGED,
    });

    const dlqBucket = new Bucket(stack, `${dlqName}-Bucket`, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const dlqLogGroup = createLambdaLogGroup({
      stack,
      functionName: dlqFunctionName,
    });

    const lambda = MonitoredFunction.create(stack, dlqFunctionName, {
      runtime: Runtime.NODEJS_22_X,
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
    statement.addResources(dlqBucket.bucketArn + "/*");

    lambda.addToRolePolicy(statement);
    lambda.addEventSource(new SqsEventSource(dlq));

    addDLQAlarm(stack, dlqName, dlq);

    return dlq;
  }
}

function addDLQAlarm(
  stack: DigitrafficStack,
  dlqName: string,
  dlq: Queue,
): void {
  const alarmName = `${dlqName}-Alarm`;
  dlq.metricNumberOfMessagesReceived({
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

function getDlqCode(Bucket: string): InlineCode {
  const functionBody = DLQ_LAMBDA_CODE.replace("__bucketName__", Bucket)
    .replace("__upload__", uploadToS3.toString())
    .replace("__handler__", createHandler().toString().substring(23)); // remove function handler() from signature

  return new InlineCode(functionBody);
}

async function uploadToS3(
  s3: S3Client,
  bucketName: string,
  body: NodeJsRuntimeStreamingBlobPayloadInputTypes,
  objectName: string,
  cannedAcl?: ObjectCannedACL,
  contentType?: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectName,
    Body: body,
    ACL: cannedAcl,
    ContentType: contentType,
  });
  try {
    await s3.send(command);
  } catch (error) {
    logger.error({
      method: "s3.uploadToS3",
      message: `upload failed to bucket ${bucketName}`,
    });
  }
}

// bucketName is unused, will be overridden in the actual lambda code below
const bucketName = "";

function createHandler(): SQSHandler {
  return async function handler(event: SQSEvent): Promise<void> {
    const millis = new Date().getTime();
    const s3 = new S3Client({});
    await Promise.all(
      event.Records.map((e: SQSRecord, idx: number) => {
        return uploadToS3(s3, bucketName, e.body, `dlq-${millis}-${idx}.json`);
      }),
    );
  };
}
