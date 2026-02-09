import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import { Duration } from "aws-cdk-lib";
import type { Function as AWSFunction } from "aws-cdk-lib/aws-lambda";
import type { PortCallStack } from "./port-call-stack.js";

export class InternalLambdas {
  constructor(stack: PortCallStack) {
    const updateLambda = this.createUpdateLambda(stack);

    Scheduler.everyMinutes(stack, "UpdateVisits", 10, updateLambda);
  }

  createUpdateLambda(stack: PortCallStack): AWSFunction {
    return FunctionBuilder.create(stack, "update-visits")
      .withTimeout(Duration.seconds(60))
      .withMemorySize(512)
      .build();
  }
}
