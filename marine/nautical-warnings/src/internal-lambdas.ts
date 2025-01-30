import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import {
  MonitoredDBFunction,
  type MonitoredFunction,
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";

export class InternalLambdas {
  constructor(stack: DigitrafficStack) {
    Scheduler.everyMinutes(
      stack,
      "NauticalWarnings-Scheduler",
      10,
      createUpdateNauticalWarningsLambda(stack),
    );
  }
}

function createUpdateNauticalWarningsLambda(
  stack: DigitrafficStack,
): MonitoredFunction {
  return MonitoredDBFunction.create(
    stack,
    "update-nautical-warnings",
    stack.createLambdaEnvironment(),
    {
      memorySize: 192,
    },
  );
}
