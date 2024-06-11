import { DigitrafficSqsQueue } from "@digitraffic/common/dist/aws/infra/sqs-queue";
import { DigitrafficStack, type StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
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
}
export class RamiStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: RamiConfiguration) {
        super(scope, id, configuration);
        const dlq = this.createDLQ(this);
        const rosmSqs = this.createRosmSqs(this, dlq);
        const smSqs = this.createSmSqs(this, dlq);

        new IntegrationApi(this, rosmSqs, smSqs, dlq);

        InternalLambdas.create(this, rosmSqs, dlq, configuration.dlqBucketName);

        const publicApi = new PublicApi(this);
        if (!this.secret) throw new Error("secret not found");
        Canaries.create(this, dlq, publicApi, this.secret);
    }

    createRosmSqs(stack: DigitrafficStack, dlq: Queue): DigitrafficSqsQueue {
        return DigitrafficSqsQueue.create(stack, "RosmSqs", {
            receiveMessageWaitTime: Duration.seconds(5),
            visibilityTimeout: Duration.seconds(60),
            deadLetterQueue: { queue: dlq, maxReceiveCount: 2 }
        });
    }

    createSmSqs(stack: DigitrafficStack, dlq: Queue): DigitrafficSqsQueue {
        return DigitrafficSqsQueue.create(stack, "SmSqs", {
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
