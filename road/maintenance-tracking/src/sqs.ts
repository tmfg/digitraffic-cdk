import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { Duration } from "aws-cdk-lib";
import { type Construct } from "constructs";

/**
 * Creates main queue and dead letter queue
 * @param scope stack
 */
export function createQueue(scope: Construct): QueueAndDLQ {
    const queueName = "MaintenanceTrackingQueue";
    const dlqQueueName = "MaintenanceTrackingQueue-DLQ";
    const dlq = new Queue(scope, dlqQueueName, {
        queueName: dlqQueueName,
        receiveMessageWaitTime: Duration.seconds(20),
        encryption: QueueEncryption.KMS_MANAGED
    });
    // SQS
    // Default visibility timeout is 30, if not handled in that time, will pop back to queue
    // SQS long polling -> waits untill timeout if no messages. Default short polling returns
    // immediately if there is no data in queue and polls again in loop all the time
    // -> more costs than in long polling
    // The name of a FIFO queue must end with the .fifo suffix. The suffix counts
    // towards the 80-character queue name quota.
    // DLQ must also be fifo for fifo main queue
    // https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html
    // https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-additional-fifo-queue-recommendations.html
    const queue = new Queue(scope, queueName, {
        queueName,
        // SQS long polling
        // https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html
        receiveMessageWaitTime: Duration.seconds(20),
        visibilityTimeout: Duration.seconds(120),
        encryption: QueueEncryption.KMS_MANAGED, // NONE?
        deadLetterQueue: {
            // Lambda should retry at least once before returning failed state. ie in case of network glitch.
            maxReceiveCount: 2,
            queue: dlq
        }
    });
    return {
        queue,
        dlq
    };
}

export interface QueueAndDLQ {
    queue: Queue;
    dlq: Queue;
}
