import { Duration } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { DigitrafficStack, StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack.js";
import { DigitrafficSqsQueue } from "@digitraffic/common/dist/aws/infra/sqs-queue.js";
import * as InternalLambdas from "./internal-lambdas.js";

export class RamiStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration);

        const queueName = "RamiMessageQueue";
        const sqs = DigitrafficSqsQueue.create(this, queueName, {
            receiveMessageWaitTime: Duration.seconds(5),
            visibilityTimeout: Duration.seconds(60)
        });

        InternalLambdas.create(this, sqs);
    }
}
