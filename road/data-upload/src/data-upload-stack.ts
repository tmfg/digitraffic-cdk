import { DigitrafficSqsQueue } from "@digitraffic/common/dist/aws/infra/sqs-queue";
import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Duration } from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Topic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";
import { IntegrationApi } from "./integration-api.js";
import { createInternalLambdas } from "./internal-lambas.js";

export interface DataUploadConfiguration extends StackConfiguration {
  readonly rttiTopicArn?: string;
}

export class DataUploadStack extends DigitrafficStack {
  constructor(
    scope: Construct,
    id: string,
    configuration: DataUploadConfiguration,
  ) {
    super(scope, id, configuration);

    const dataQueue = this.createSqsQueue("Data");
    const mqttQueue = this.createSqsQueue("Mqtt");

    if (configuration.rttiTopicArn) {
      this.createRttiSqsReader(configuration.rttiTopicArn);
    }

    createInternalLambdas(this, dataQueue, mqttQueue);

    new IntegrationApi(this, dataQueue);
  }

  createRttiSqsReader(topicArn: string): void {
    const lambda = FunctionBuilder.create(this, "handle-rtti")
      .withMemorySize(128)
      .withReservedConcurrentExecutions(3)
      .withTimeout(Duration.seconds(10))
      .build();

    // the topic is fifo-topic, so can't put lambda to it directly
    // so we create a queue and messages go through it

    const topic = Topic.fromTopicAttributes(this, "rttiTopic", { topicArn });
    // SQS queue encrypted by AWS managed KMS key cannot be used as SNS subscription
    const queue = new DigitrafficSqsQueue(this, "RttiQueue", {
      receiveMessageWaitTime: Duration.seconds(20),
      visibilityTimeout: Duration.seconds(10),
    });

    topic.addSubscription(new SqsSubscription(queue));
    queue.grantConsumeMessages(lambda);
    lambda.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 20,
        maxBatchingWindow: Duration.seconds(3),
      }),
    );
  }

  createSqsQueue(name: string): DigitrafficSqsQueue {
    const dlq = new Queue(this, `${name}DLQ`, {
      queueName: `${name}DLQ`,
      receiveMessageWaitTime: Duration.seconds(20),
      encryption: QueueEncryption.KMS_MANAGED,
    });

    return DigitrafficSqsQueue.create(this, `${name}Queue`, {
      receiveMessageWaitTime: Duration.seconds(20),
      visibilityTimeout: Duration.seconds(60),
      deadLetterQueue: { queue: dlq, maxReceiveCount: 2 },
    });
  }
}
