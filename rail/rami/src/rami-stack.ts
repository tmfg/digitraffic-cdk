import { DigitrafficSqsQueue } from "@digitraffic/common/dist/aws/infra/sqs-queue.js";
import { DigitrafficStack, StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack.js";
import { Duration } from "aws-cdk-lib";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";
import * as Canaries from "./canaries.js";
import * as InternalLambdas from "./internal-lambdas.js";
import { PublicApi } from "./public-api.js";
import { IntegrationApi } from "./integration-api.js";

export interface RamiConfiguration extends StackConfiguration {
    readonly dlqBucketName: string;
    readonly dlqNotificationDuration?: Duration;
    readonly enablePublicApi: boolean;
}
export class RamiStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: RamiConfiguration) {
        super(scope, id, configuration);
        const dlq = this.createDLQ(this);
        const sqs = this.createSQS(this, dlq);
        const integrationApi = new IntegrationApi(this, sqs, dlq);
        InternalLambdas.create(this, sqs, dlq, configuration.dlqBucketName);
        if (configuration.enablePublicApi === true) {
            const publicApi = new PublicApi(this);
            if (!this.secret) throw new Error("secret not found");
            Canaries.create(this, dlq, publicApi, this.secret);
        }
    }

    createSQS(stack: DigitrafficStack, dlq: Queue): DigitrafficSqsQueue {
        return DigitrafficSqsQueue.create(stack, "SQS", {
            receiveMessageWaitTime: Duration.seconds(5),
            visibilityTimeout: Duration.seconds(60),
            deadLetterQueue: { queue: dlq, maxReceiveCount: 2 }
        });
    }

    createDLQ(stack: DigitrafficStack): Queue {
        const dlqName = "RAMI-DLQ";
        return new Queue(stack, dlqName, {
            queueName: dlqName,
            receiveMessageWaitTime: Duration.seconds(20),
            encryption: QueueEncryption.KMS_MANAGED
        });
    }
}
