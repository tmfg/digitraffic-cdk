import { CountingSitesEnvKeys } from "./keys.js";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {
        const updateMetadataLambda = InternalLambdas.createUpdateMetadataLambdaForFintraffic(stack);
        const updateDataLambda = InternalLambdas.createUpdateDataLambdaForFintraffic(stack);

        Scheduler.everyHour(stack, "RuleForMetadataUpdate", updateMetadataLambda);
        Scheduler.everyHour(stack, "RuleForDataUpdate", updateDataLambda);        

        stack.grantSecret(updateMetadataLambda, updateDataLambda);
    }

    private static createUpdateMetadataLambdaForFintraffic(stack: DigitrafficStack): MonitoredFunction {
        const environment = stack.createLambdaEnvironment();
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = "Fintraffic";

        return MonitoredFunction.createV2(stack, "update-metadata", environment, {
            functionName: stack.configuration.shortName + "-UpdateMetadata-Fintraffic"
        });
    }

    private static createUpdateDataLambdaForFintraffic(stack: DigitrafficStack): MonitoredFunction {
        const environment = stack.createLambdaEnvironment();
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = "Fintraffic";

        return MonitoredFunction.createV2(stack, "update-data", environment, {
            functionName: stack.configuration.shortName + "-UpdateData-Fintraffic",
            memorySize: 256
        });
    }
}
