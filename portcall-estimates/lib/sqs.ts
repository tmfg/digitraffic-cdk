import {Queue, QueueEncryption} from "@aws-cdk/aws-sqs";
import {Construct} from "@aws-cdk/core";

export function createQueue(scope: Construct): QueueAndDLQ {
    const queueName = 'PortcallEstimateQueue';
    const dlqQueueName = 'PortcallEstimateQueue-DLQ'
    const dlq = new Queue(scope, dlqQueueName, {
        queueName: dlqQueueName,
        encryption: QueueEncryption.KMS_MANAGED
    });
    const queue = new Queue(scope, queueName, {
        queueName,
        encryption: QueueEncryption.KMS_MANAGED,
        deadLetterQueue: {
            maxReceiveCount: 3,
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