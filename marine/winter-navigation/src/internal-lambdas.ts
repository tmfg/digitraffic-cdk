import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Duration } from "aws-cdk-lib";
import type { Function as AwsFunction } from "aws-cdk-lib/aws-lambda";

export function create(stack: DigitrafficStack): void {
  const updateLambda = createUpdateDataLambda(stack);

  Scheduler.everyMinutes(stack, "UpdateDataRule", 5, updateLambda);
}

function createUpdateDataLambda(stack: DigitrafficStack): AwsFunction {
  const environment = stack.createLambdaEnvironment();

  return FunctionBuilder.create(stack, "update-data")
    .withEnvironment(environment)
    .withTimeout(Duration.minutes(5))
    .withMemorySize(512)
    .build();
}
