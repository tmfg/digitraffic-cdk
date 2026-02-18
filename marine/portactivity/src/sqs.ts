import { Duration } from "aws-cdk-lib";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";

export function createQueue(scope: Construct): QueueAndDLQ {
  const queueName = "PortActivity-Timestamps";
  const dlqQueueName = "PortActivity-Timestamps-DLQ";
  const dlq = new Queue(scope, dlqQueueName, {
    queueName: dlqQueueName,
    receiveMessageWaitTime: Duration.seconds(20),
    encryption: QueueEncryption.KMS_MANAGED,
  });
  const queue = new Queue(scope, queueName, {
    queueName,
    encryption: QueueEncryption.KMS_MANAGED,
    receiveMessageWaitTime: Duration.seconds(20),
    deadLetterQueue: {
      maxReceiveCount: 3,
      queue: dlq,
    },
  });
  return {
    queue,
    dlq,
  };
}

export interface QueueAndDLQ {
  queue: Queue;
  dlq: Queue;
}
