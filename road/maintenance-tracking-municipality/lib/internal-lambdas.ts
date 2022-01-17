import {DigitrafficLogSubscriptions} from "digitraffic-common/aws/infra/stack/subscription";
import {MaintenanceTrackingMunicipalityEnvKeys} from "./keys";
import {MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {Scheduler} from "digitraffic-common/aws/infra/scheduler";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {

        const updateDataForAutoriOuluLambda = this.createUpdateDataLambdaForAutoriOulu(stack);
        Scheduler.everyMinutes(stack, 'RuleForDataUpdate', 10, updateDataForAutoriOuluLambda);

        new DigitrafficLogSubscriptions(stack, updateDataForAutoriOuluLambda);
        stack.grantSecret(updateDataForAutoriOuluLambda);
    }

    private createUpdateDataLambdaForAutoriOulu(stack: DigitrafficStack): MonitoredFunction {

        const domain = 'autori-oulu';
        const environment = stack.createLambdaEnvironment();
        environment[MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME] = domain;
        environment[MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_PREFIX] = 'mt.municipality.autori-oulu';

        return MonitoredFunction.createV2(stack, 'update-data', environment, {
            functionName: stack.configuration.shortName + '-' + domain,
            memorySize: 256,
        });
    }
}