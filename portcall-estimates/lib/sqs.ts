import {Queue, QueueEncryption} from "@aws-cdk/aws-sqs";
import {Construct} from "@aws-cdk/core";

export function createQueue(scope: Construct): Queue {
    const queueName = 'PortcallEstimateQueue';
    const dlqQueueName = 'PortcallEstimateQueue-DLQ'
    return new Queue(scope, queueName, {
        queueName,
        encryption: QueueEncryption.KMS_MANAGED,
        deadLetterQueue: {
            maxReceiveCount: 3,
            queue: new Queue(scope, dlqQueueName, {
                queueName: dlqQueueName,
                encryption: QueueEncryption.KMS_MANAGED
            })
        }
    });
}