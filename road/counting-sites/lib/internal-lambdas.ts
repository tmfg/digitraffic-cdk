import {DigitrafficLogSubscriptions} from "digitraffic-common/aws/infra/stack/subscription";
import {CountingSitesEnvKeys} from "./keys";
import {MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {Scheduler} from "digitraffic-common/aws/infra/scheduler";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {
        const updateMetadataLambda = this.createUpdateMetadataLambdaForOulu(stack);
        const updateDataLambda = this.createUpdateDataLambdaForOulu(stack);

        Scheduler.everyHour(stack, 'RuleForMetadataUpdate', updateMetadataLambda);
        Scheduler.everyHour(stack, 'RuleForDataUpdate', updateDataLambda);

        new DigitrafficLogSubscriptions(stack, updateMetadataLambda, updateDataLambda);
        stack.grantSecret(updateMetadataLambda, updateDataLambda);
    }

    private createUpdateMetadataLambdaForOulu(stack: DigitrafficStack): MonitoredFunction {
        const environment = stack.createLambdaEnvironment();
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = 'Oulu';
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = 'cs.oulu';

        return MonitoredFunction.createV2(stack, 'update-metadata', environment, {
            functionName: stack.configuration.shortName + '-UpdateMetadata-Oulu',
        });
    }

    private createUpdateDataLambdaForOulu(stack: DigitrafficStack): MonitoredFunction {
        const environment = stack.createLambdaEnvironment();
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = 'Oulu';
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = 'cs.oulu';

        return MonitoredFunction.createV2(stack, 'update-data', environment, {
            functionName: stack.configuration.shortName + '-UpdateData-Oulu',
            memorySize: 256,
        });
    }
}