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
    const queue = new Queue(scope, queueName, {
        queueName,
        encryption: QueueEncryption.KMS_MANAGED,
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