import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import {
  MonitoredDBFunction,
  type MonitoredFunction,
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";

export function create(stack: DigitrafficStack): void {
  const updateLambda = createUpdateDataLambda(stack);

  Scheduler.everyMinutes(stack, "UpdateDataRule", 1, updateLambda);
}

function createUpdateDataLambda(stack: DigitrafficStack): MonitoredFunction {
  const environment = stack.createLambdaEnvironment();

  return MonitoredDBFunction.create(stack, "update-data", environment, {
    memorySize: 512,
  });
}
