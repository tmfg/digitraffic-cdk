import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficLogSubscriptions } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { MaintenanceTrackingMunicipalityEnvKeys } from "./keys.js";

export class InternalLambdasCdk {
  constructor(stack: DigitrafficStack) {
    const updateDataForPaikanninKuopioLambda =
      InternalLambdasCdk.createUpdateDataLambdaForPaikannin(
        stack,
        "paikannin-kuopio",
        5,
      );

    new DigitrafficLogSubscriptions(stack, updateDataForPaikanninKuopioLambda);
    stack.grantSecret(updateDataForPaikanninKuopioLambda);
  }

  private static createUpdateDataLambdaForPaikannin(
    stack: DigitrafficStack,
    domain: string,
    runEveryMinutes: number,
  ): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME] = domain;
    environment[MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_PREFIX] =
      `mt.municipality.${domain}`;
    // Run every 5 minutes and timeout before it
    const lambdaFunction = MonitoredFunction.createV2(
      stack,
      "paikannin-update-data",
      environment,
      {
        functionName: `${stack.configuration.shortName}-${domain}`,
        memorySize: 256,
        singleLambda: false,
        timeout: 120,
        reservedConcurrentExecutions: 1,
      },
    );

    if (runEveryMinutes > 0) {
      Scheduler.everyMinutes(
        stack,
        `MaintenanceTrackingMunicipalityDataUpdate-${domain}`,
        runEveryMinutes,
        lambdaFunction,
      );
    }
    return lambdaFunction;
  }
}
