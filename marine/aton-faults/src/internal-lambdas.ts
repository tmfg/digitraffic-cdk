import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import type { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { AtonProps } from "./app-props.js";
import { AtonEnvKeys } from "./keys.js";

export function create(stack: DigitrafficStack): void {
  const updateFaultsLambda = createUpdateFaultsLambda(stack);

  Scheduler.everyMinutes(stack, "Rule", 10, updateFaultsLambda);
}

function createUpdateFaultsLambda(stack: DigitrafficStack): MonitoredFunction {
  const environment = stack.createLambdaEnvironment();
  environment[AtonEnvKeys.INTEGRATIONS] = JSON.stringify(
    (stack.configuration as AtonProps).integrations,
  );

  return MonitoredDBFunction.create(stack, "update-faults", environment, {
    memorySize: 512,
  });
}
