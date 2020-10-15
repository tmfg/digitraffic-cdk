import {Queue, QueueEncryption} from "@aws-cdk/aws-sqs";
import {Construct, Duration} from "@aws-cdk/core";

export function createQueue(scope: Construct): QueueAndDLQ {
    const queueName = 'PortcallEstimateQueue';
    const dlqQueueName = 'PortcallEstimateQueue-DLQ'
    const dlq = new Queue(scope, dlqQueueName, {
        queueName: dlqQueueName,
        receiveMessageWaitTime: Duration.seconds(20),
        encryption: QueueEncryption.KMS_MANAGED
    });
    const queue = new Queue(scope, queueName, {
        queueName,
        encryption: QueueEncryption.KMS_MANAGED,
        receiveMessageWaitTime: Duration.seconds(20),
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