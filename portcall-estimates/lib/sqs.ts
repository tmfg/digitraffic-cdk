import {Queue, QueueEncryption} from "@aws-cdk/aws-sqs";
import {Construct} from "@aws-cdk/core";

export function createQueue(scope: Construct): Queue {
    const queueName = 'PortcallEstimateQueue';
    return new Queue(scope, queueName, {
        queueName,
        encryption: QueueEncryption.KMS_MANAGED
    });
}