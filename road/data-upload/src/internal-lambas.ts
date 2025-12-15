import type { DigitrafficStack } from "@digitraffic/common";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import { Duration } from "aws-cdk-lib";
import type { Function as AwsFunction } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import type { Queue } from "aws-cdk-lib/aws-sqs";

export function createInternalLambdas(
  stack: DigitrafficStack,
  dataQueue: Queue,
  mqttQueue: Queue,
): void {
  const deleteLambda = createDeleteOldData(stack);
  Scheduler.everyHour(stack, "DeleteOldMessagesRule", deleteLambda);

  const handleNewMessages = createHandleNewMessagesLambda(stack, mqttQueue);
  dataQueue.grantConsumeMessages(handleNewMessages);
  mqttQueue.grantSendMessages(handleNewMessages);

  handleNewMessages.addEventSource(new SqsEventSource(dataQueue, {
    batchSize: 20,
    maxBatchingWindow: Duration.seconds(3),
  }));

  const mqttSendLambda = createMqttSendLambda(stack);
  mqttQueue.grantConsumeMessages(mqttSendLambda);
  mqttSendLambda.addEventSource(new SqsEventSource(mqttQueue, {
    batchSize: 20,
    maxBatchingWindow: Duration.seconds(3),
  }));
}

function createDeleteOldData(stack: DigitrafficStack): AwsFunction {
  return FunctionBuilder.create(stack, "delete-old-messages").build();
}

function createMqttSendLambda(
  stack: DigitrafficStack,
): AwsFunction {
  return FunctionBuilder.create(stack, "send-mqtt")
    .withMemorySize(128)
    .withReservedConcurrentExecutions(3)
    .withTimeout(Duration.seconds(10))
    .build();
}

function createHandleNewMessagesLambda(
  stack: DigitrafficStack,
  mqttQueue: Queue,
): AwsFunction {
  return FunctionBuilder.create(stack, "handle-new-messages")
    .withEnvironment({
      MQTT_QUEUE_URL: mqttQueue.queueUrl,
    })
    .build();
}
