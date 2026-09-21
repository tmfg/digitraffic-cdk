import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import { Duration } from "aws-cdk-lib";
import { Schedule } from "aws-cdk-lib/aws-events";
import type { Function as AWSFunction } from "aws-cdk-lib/aws-lambda";
import type { PortCallStack } from "./port-call-stack.js";

export class InternalLambdas {
  constructor(
    stack: PortCallStack,
    enableUpdate: boolean,
    limitUpdateToBusinessHours: boolean,
  ) {
    const updateLambda = this.createUpdateLambda(stack);

    if (enableUpdate) {
      if (limitUpdateToBusinessHours) {
        new Scheduler(
          stack,
          "UpdateVisits",
          // Test NEMO is unavailable overnight, so keep the schedule within daytime hours.
          Schedule.cron({
            minute: "0,10,20,30,40,50",
            hour: "5-15",
          }),
          updateLambda,
        );
      } else {
        Scheduler.everyMinutes(stack, "UpdateVisits", 10, updateLambda);
      }
    }
  }

  createUpdateLambda(stack: PortCallStack): AWSFunction {
    return FunctionBuilder.create(stack, "update-visits")
      .withTimeout(Duration.seconds(60))
      .withMemorySize(512)
      .build();
  }
}
