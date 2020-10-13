import {Queue, QueueEncryption} from "@aws-cdk/aws-sqs";
import {Construct} from "@aws-cdk/core";

/**
 * Creates main queue and dead letter queue
 * @param scope stack
 */
export function createQueue(scope: Construct): QueueAndDLQ {
    const queueName = 'MaintenanceTrackingQueue';
    const dlqQueueName = 'MaintenanceTrackingQueue-DLQ'
    const dlq = new Queue(scope, dlqQueueName, {
        queueName: dlqQueueName,
        encryption: QueueEncryption.KMS_MANAGED
    });
    // TODO
    // Default visibility timeout is 30, if not handled in that time, will pop back to queue
    // SQS long polling -> waits untill timeout if no messages. Default short polling returns
    // immediately if there is no data in queue and polls again in loop all the time
    // -> more costs than in long polling
    // The name of a FIFO queue must end with the .fifo suffix. The suffix counts
    // towards the 80-character queue name quota. To determine whether a queue is FIFO,
    // you can check whether the queue name ends with the suffix.
    // https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html
    // https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-additional-fifo-queue-recommendations.html
    const queue = new Queue(scope, queueName, {
        queueName,
        // fifo: true, // Default is false = Standard queues provide a loose-FIFO
        encryption: QueueEncryption.KMS_MANAGED, // NONE?
        deadLetterQueue: {
            // First fail puts it to DLQ as order must remain.
            // Lambda should retry at least once before returning failed state. ie in case of network glitch.
            maxReceiveCount: 1,
            queue: dlq
        }
    });
    return {
        queue,
        dlq
    };
}

export interface QueueAndDLQ {
    queue: Queue,
    dlq: Queue
}