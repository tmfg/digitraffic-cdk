import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {databaseFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";
import {CountingSitesEnvKeys} from "./keys";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";

const APPLICATION_NAME = 'CountingSites';

export class InternalLambdas {
    constructor(stack: DigitrafficStack, secret: ISecret) {
        this.createUpdateMetadataLambdaForOulu(stack, secret);
        this.createUpdateDataLambdaForOulu(stack, secret);
    }

    private createUpdateMetadataLambdaForOulu(stack: DigitrafficStack, secret: ISecret) {
        const functionName = APPLICATION_NAME + '-UpdateMetadata-Oulu';

        const environment = stack.createDefaultLambdaEnvironment(APPLICATION_NAME);
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = 'Oulu';
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = 'cs.oulu';

        const lambdaConf = databaseFunctionProps(stack, environment, functionName, 'update-metadata');
        const updateMetadataLambda = MonitoredFunction.create(stack, functionName, lambdaConf);
        secret.grantRead(updateMetadataLambda);
        new DigitrafficLogSubscriptions(stack, updateMetadataLambda);

        Scheduler.everyHour(stack, 'RuleForMetadataUpdate', updateMetadataLambda);
    }

    private createUpdateDataLambdaForOulu(stack: DigitrafficStack, secret: ISecret) {
        const functionName = APPLICATION_NAME + '-UpdateData-Oulu';

        const environment = stack.createDefaultLambdaEnvironment(APPLICATION_NAME);
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = 'Oulu';
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = 'cs.oulu';

        const lambdaConf = databaseFunctionProps(stack, environment, functionName, 'update-data', {
            memorySize: 256
        });

        const updateMetadataLambda = MonitoredFunction.create(stack, functionName, lambdaConf);
        secret.grantRead(updateMetadataLambda);
        new DigitrafficLogSubscriptions(stack, updateMetadataLambda);

        Scheduler.everyHour(stack, 'RuleForDataUpdate', updateMetadataLambda);
    }
}