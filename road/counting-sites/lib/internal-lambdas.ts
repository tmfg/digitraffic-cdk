import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {Duration} from "@aws-cdk/core";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import * as lambda from "@aws-cdk/aws-lambda";
import {createSubscription, DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";
import {CountingSitesEnvKeys} from "./keys";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {TrafficType} from "digitraffic-common/model/traffictype";
import {Architecture} from "@aws-cdk/aws-lambda";
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

        const lambdaConf = dbFunctionProps(stack, {
            functionName,
            code: new lambda.AssetCode('dist/lambda/update-metadata'),
            handler: 'update-metadata.handler',
            environment,
        });

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

        const lambdaConf = dbFunctionProps(stack, {
            functionName,
            code: new lambda.AssetCode('dist/lambda/update-data'),
            handler: 'update-data.handler',
            environment,
            memorySize: 256
        });

        const updateMetadataLambda = MonitoredFunction.create(stack, functionName, lambdaConf);
        secret.grantRead(updateMetadataLambda);
        new DigitrafficLogSubscriptions(stack, updateMetadataLambda);

        Scheduler.everyHour(stack, 'RuleForDataUpdate', updateMetadataLambda);
    }
}