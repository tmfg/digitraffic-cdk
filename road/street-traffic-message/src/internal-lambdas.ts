import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import {
  MonitoredDBFunction,
  type MonitoredFunction,
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";

export class InternalLambdas {
  constructor(stack: DigitrafficStack) {
    const updatePermitsLambdaForLahti = InternalLambdas
      .createUpdatePermitsLambda(stack, "lahti");

    Scheduler.everyHour(
      stack,
      "RuleForPermitUpdateForLahti",
      updatePermitsLambdaForLahti,
    );
  }

  private static createUpdatePermitsLambda(
    stack: DigitrafficStack,
    permitDomain: string,
  ): MonitoredFunction {
    const lambdaEnvironment = stack.createLambdaEnvironment();
    // eslint-disable-next-line dot-notation
    lambdaEnvironment["PERMIT_DOMAIN"] = permitDomain;

    return MonitoredDBFunction.create(
      stack,
      "update-permits",
      lambdaEnvironment,
      {
        memorySize: 256,
        functionName: "STM-UpdatePermits-" + permitDomain,
      },
    );
  }
}
