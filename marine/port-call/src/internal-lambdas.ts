import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { type PortCallStack } from "./port-call-stack.js";
import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import type { Function } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";

export class InternalLambdas {
  constructor(stack: PortCallStack) {
    const updateLambda = this.createUpdateLambda(stack);

    Scheduler.everyMinutes(stack, "UpdateVisits", 10, updateLambda);
  }

  createUpdateLambda(stack: PortCallStack): Function {
    return FunctionBuilder.create(stack, "update-visits")
      .withTimeout(Duration.seconds(60))
      .withMemorySize(512)
      .build();
  }
}
