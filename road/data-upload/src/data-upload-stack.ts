import { type Construct } from "constructs";
import {
  DigitrafficStack,
  type StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import { IntegrationApi } from "./integration-api.js";
import { DigitrafficSqsQueue } from "@digitraffic/common/dist/aws/infra/sqs-queue";
import { Duration } from "aws-cdk-lib";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { create } from "./internal-lambas.js";

export class DataUploadStack extends DigitrafficStack {
  constructor(
    scope: Construct,
    id: string,
    configuration: StackConfiguration,
  ) {
    super(scope, id, configuration);

    const dataQueue = this.createSqsQueue();

    create(this, dataQueue);

    new IntegrationApi(this, dataQueue);
  }

  createSqsQueue(): DigitrafficSqsQueue {
    const dlq = new Queue(this, "DataDLQ", {
      queueName: "DataDLQ",
      receiveMessageWaitTime: Duration.seconds(20),
      encryption: QueueEncryption.KMS_MANAGED,
    });

    return DigitrafficSqsQueue.create(this, "DataQueue", {
      receiveMessageWaitTime: Duration.seconds(2),
      visibilityTimeout: Duration.seconds(60),
      deadLetterQueue: { queue: dlq, maxReceiveCount: 2 },
    });
  }
}
