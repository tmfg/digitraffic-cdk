import { DigitrafficLogSubscriptions } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { CountingSitesEnvKeys } from "./keys";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {
        const updateMetadataLambda = InternalLambdas.createUpdateMetadataLambdaForOulu(stack);
        const updateDataLambda = InternalLambdas.createUpdateDataLambdaForOulu(stack);

        Scheduler.everyHour(stack, "RuleForMetadataUpdate", updateMetadataLambda);
        Scheduler.everyHour(stack, "RuleForDataUpdate", updateDataLambda);

        new DigitrafficLogSubscriptions(stack, updateMetadataLambda, updateDataLambda);
        stack.grantSecret(updateMetadataLambda, updateDataLambda);
    }

    private static createUpdateMetadataLambdaForOulu(stack: DigitrafficStack): MonitoredFunction {
        const environment = stack.createLambdaEnvironment();
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = "Oulu";
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = "cs.oulu";

        return MonitoredFunction.createV2(stack, "update-metadata", environment, {
            functionName: stack.configuration.shortName + "-UpdateMetadata-Oulu"
        });
    }

    private static createUpdateDataLambdaForOulu(stack: DigitrafficStack): MonitoredFunction {
        const environment = stack.createLambdaEnvironment();
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = "Oulu";
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = "cs.oulu";

        return MonitoredFunction.createV2(stack, "update-data", environment, {
            functionName: stack.configuration.shortName + "-UpdateData-Oulu",
            memorySize: 256
        });
    }
}
