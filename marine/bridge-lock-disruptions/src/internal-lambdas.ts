import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import type { IFunction } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";

export function create(stack: DigitrafficStack): IFunction {
  const environment = stack.createDefaultLambdaEnvironment(
    "BridgeLockDisruption",
  );

  const updateDisruptionsLambda = FunctionBuilder.create(stack, "update-disruptions")
    .withEnvironment(environment)
    .withTimeout(Duration.seconds(10))
    .build();

  Scheduler.everyMinutes(
    stack,
    "UpdateDisruptionsRule",
    10,
    updateDisruptionsLambda,
  );

  return updateDisruptionsLambda;
}
