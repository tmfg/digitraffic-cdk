import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import type { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";

export function create(stack: DigitrafficStack): void {
  const updateLambda = createUpdateDataLambda(stack);

  Scheduler.everyMinutes(stack, "UpdateDataRule", 5, updateLambda);
}

function createUpdateDataLambda(stack: DigitrafficStack): MonitoredFunction {
  const environment = stack.createLambdaEnvironment();

  return MonitoredDBFunction.create(stack, "update-data", environment, {
    memorySize: 512,
  });
}
