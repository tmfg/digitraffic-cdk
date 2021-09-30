import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {Duration} from "@aws-cdk/core";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {dbLambdaConfiguration, SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";
import * as lambda from "@aws-cdk/aws-lambda";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {DatabaseEnvironmentKeys} from "digitraffic-common/secrets/dbsecret";
import {CountingSitesEnvKeys} from "./keys";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficStack, StackConfiguration} from "digitraffic-common/stack/stack";

const APPLICATION_NAME = 'CountingSites';

export class InternalLambdas {
    constructor(stack: DigitrafficStack, secret: ISecret) {
        this.createUpdateMetadataLambdaForOulu(stack, secret);
        this.createUpdateDataLambdaForOulu(stack, secret);
    }

    private createUpdateMetadataLambdaForOulu(stack: DigitrafficStack, secret: ISecret) {
        const functionName = APPLICATION_NAME + '-UpdateMetadata-Oulu';

        const environment: LambdaEnvironment = {};
        environment[SECRET_ID_KEY] = stack.configuration.secretId;
        environment[DatabaseEnvironmentKeys.DB_APPLICATION] = APPLICATION_NAME;
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = 'Oulu';
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = 'cs.oulu';

        const lambdaConf = dbLambdaConfiguration(stack.vpc, stack.lambdaDbSg, stack.configuration, {
            functionName,
            code: new lambda.AssetCode('dist/lambda/update-metadata'),
            handler: 'update-metadata.handler',
            environment,
            reservedConcurrentExecutions: 1,
            memorySize: 128
        });

        const updateMetadataLambda = new MonitoredFunction(stack, functionName, lambdaConf, stack.alarmTopic, stack.warningTopic);

        secret.grantRead(updateMetadataLambda);

        const rule = new Rule(stack, 'RuleForMetadataUpdate', {
            schedule: Schedule.rate(Duration.minutes(10))
        });
        rule.addTarget(new LambdaFunction(updateMetadataLambda));

        createSubscription(updateMetadataLambda, functionName, stack.configuration.logsDestinationArn, stack);
    }

    private createUpdateDataLambdaForOulu(stack: DigitrafficStack, secret: ISecret) {
        const functionName = APPLICATION_NAME + '-UpdateData-Oulu';

        const environment: LambdaEnvironment = {};
        environment[SECRET_ID_KEY] = stack.configuration.secretId;
        environment[DatabaseEnvironmentKeys.DB_APPLICATION] = APPLICATION_NAME;
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = 'Oulu';
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = 'cs.oulu';

        const lambdaConf = dbLambdaConfiguration(stack.vpc, stack.lambdaDbSg, stack.configuration, {
            functionName,
            code: new lambda.AssetCode('dist/lambda/update-data'),
            handler: 'update-data.handler',
            environment,
            reservedConcurrentExecutions: 1,
            memorySize: 256
        });

        const updateMetadataLambda = new MonitoredFunction(stack, functionName, lambdaConf, stack.alarmTopic, stack.warningTopic);

        secret.grantRead(updateMetadataLambda);

        const rule = new Rule(stack, 'RuleForDataUpdate', {
            schedule: Schedule.rate(Duration.hours(1))
        });
        rule.addTarget(new LambdaFunction(updateMetadataLambda));

        createSubscription(updateMetadataLambda, functionName, stack.configuration.logsDestinationArn, stack);
    }
}