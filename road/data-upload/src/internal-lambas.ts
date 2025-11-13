import type { DigitrafficStack } from "@digitraffic/common";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import {
  MonitoredDBFunction,
  type MonitoredFunction,
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import type { Queue } from "aws-cdk-lib/aws-sqs";

export function createInternalLambdas(
  stack: DigitrafficStack,
  dataQueue: Queue,
): void {
  const deleteLambda = createDeleteOldData(stack);
  Scheduler.everyHour(stack, "DeleteOldMessagesRule", deleteLambda);

  const handleVariableSigns = createHandleVariableSignsLambda(stack);
  dataQueue.grantConsumeMessages(handleVariableSigns);

  handleVariableSigns.addEventSource(new SqsEventSource(dataQueue));
}

function createDeleteOldData(stack: DigitrafficStack): MonitoredFunction {
  return MonitoredDBFunction.create(stack, "delete-old-messages");
}

function createHandleVariableSignsLambda(
  stack: DigitrafficStack,
): MonitoredFunction {
  return MonitoredDBFunction.create(stack, "handle-variable-signs");
}
