import { DigitrafficLogSubscriptions } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { MaintenanceTrackingMunicipalityEnvKeys } from "./keys.js";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { type DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";

export class InternalLambdasCdk {
  constructor(stack: DigitrafficStack) {
    const updateDataForAutoriOuluLambda = InternalLambdasCdk
      .createUpdateDataLambdaForAutori(
        stack,
        "autori-oulu",
        5,
      );
    const updateDataForAutoriKuopioLambda = InternalLambdasCdk
      .createUpdateDataLambdaForAutori(
        stack,
        "autori-kuopio",
        5,
      );
    const updateDataForPaikanninKuopioLambda = InternalLambdasCdk
      .createUpdateDataLambdaForPaikannin(
        stack,
        "paikannin-kuopio",
        5,
      );

    new DigitrafficLogSubscriptions(stack, updateDataForAutoriOuluLambda);
    new DigitrafficLogSubscriptions(stack, updateDataForAutoriKuopioLambda);
    new DigitrafficLogSubscriptions(stack, updateDataForPaikanninKuopioLambda);
    stack.grantSecret(updateDataForAutoriOuluLambda);
    stack.grantSecret(updateDataForAutoriKuopioLambda);
    stack.grantSecret(updateDataForPaikanninKuopioLambda);
  }

  private static createUpdateDataLambdaForAutori(
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
      "autori-update-data",
      environment,
      {
        functionName: stack.configuration.shortName + "-" + domain,
        memorySize: 256,
        singleLambda: false,
        timeout: 120,
        reservedConcurrentExecutions: 1,
      },
    );

    Scheduler.everyMinutes(
      stack,
      `MaintenanceTrackingMunicipalityDataUpdate-${domain}`,
      runEveryMinutes,
      lambdaFunction,
    );
    return lambdaFunction;
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
        functionName: stack.configuration.shortName + "-" + domain,
        memorySize: 256,
        singleLambda: false,
        timeout: 120,
        reservedConcurrentExecutions: 1,
      },
    );

    Scheduler.everyMinutes(
      stack,
      `MaintenanceTrackingMunicipalityDataUpdate-${domain}`,
      runEveryMinutes,
      lambdaFunction,
    );
    return lambdaFunction;
  }
}
