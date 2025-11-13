import { type Construct } from "constructs";
import {
  DigitrafficStack,
  type StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import { IntegrationApi } from "./integration-api.js";
import { DigitrafficSqsQueue } from "@digitraffic/common/dist/aws/infra/sqs-queue";
import { Duration } from "aws-cdk-lib";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { createInternalLambdas } from "./internal-lambas.js";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
//import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface DataUploadConfiguration extends StackConfiguration {
  //  readonly sqsArn: string;
}

export class DataUploadStack extends DigitrafficStack {
  constructor(
    scope: Construct,
    id: string,
    configuration: DataUploadConfiguration,
  ) {
    super(scope, id, configuration);

    const dataQueue = this.createSqsQueue();
    this.createSqsReader(""); //configuration.sqsArn);

    createInternalLambdas(this, dataQueue);

    new IntegrationApi(this, dataQueue);
  }

  createSqsReader(_sqsArn: string): void {
    //const lambda =
    MonitoredDBFunction.create(this, "handle-sqs");
    //    const queue = Queue.fromQueueArn(this, "sqs", sqsArn);

    //    lambda.addEventSource(new SqsEventSource(queue));
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
