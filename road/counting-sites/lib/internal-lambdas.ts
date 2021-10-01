import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {Duration} from "@aws-cdk/core";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import * as lambda from "@aws-cdk/aws-lambda";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {CountingSitesEnvKeys} from "./keys";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {TrafficType} from "digitraffic-common/model/traffictype";

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

        const updateMetadataLambda = new MonitoredFunction(stack, functionName, lambdaConf, TrafficType.ROAD);

        secret.grantRead(updateMetadataLambda);

        const rule = new Rule(stack, 'RuleForMetadataUpdate', {
            schedule: Schedule.rate(Duration.hours(1))
        });
        rule.addTarget(new LambdaFunction(updateMetadataLambda));

        createSubscription(updateMetadataLambda, functionName, stack.configuration.logsDestinationArn, stack);
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

        const updateMetadataLambda = new MonitoredFunction(stack, functionName, lambdaConf, TrafficType.ROAD);

        secret.grantRead(updateMetadataLambda);

        const rule = new Rule(stack, 'RuleForDataUpdate', {
            schedule: Schedule.rate(Duration.hours(1))
        });
        rule.addTarget(new LambdaFunction(updateMetadataLambda));

        createSubscription(updateMetadataLambda, functionName, stack.configuration.logsDestinationArn, stack);
    }
}