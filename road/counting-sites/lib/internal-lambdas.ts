import {ISecurityGroup, IVpc} from "@aws-cdk/aws-ec2";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {Duration, Stack} from "@aws-cdk/core";
import {AppProps} from "./app-props";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {dbLambdaConfiguration, SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";
import * as lambda from "@aws-cdk/aws-lambda";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {DatabaseEnvironmentKeys} from "digitraffic-common/secrets/dbsecret";
import {CountingSitesEnvKeys} from "./keys";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";

const APPLICATION_NAME = 'CountingSites';

export class InternalLambdas {
    constructor(stack: Stack, vpc: IVpc, lambdaDbSg: ISecurityGroup, appProps: AppProps, secret: ISecret) {
        this.createUpdateMetadataLambdaForOulu(stack, vpc, lambdaDbSg, appProps, secret);
        this.createUpdateDataLambdaForOulu(stack, vpc, lambdaDbSg, appProps, secret);
    }

    private createUpdateMetadataLambdaForOulu(stack: Stack, vpc: IVpc, lambdaDbSg: ISecurityGroup, appProps: AppProps, secret: ISecret) {
        const functionName = APPLICATION_NAME + '-UpdateMetadata-Oulu';

        const environment: LambdaEnvironment = {};
        environment[SECRET_ID_KEY] = appProps.secretId;
        environment[DatabaseEnvironmentKeys.DB_APPLICATION] = APPLICATION_NAME;
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = 'Oulu';
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = 'cs.oulu';

        const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, appProps, {
            functionName,
            code: new lambda.AssetCode('dist/lambda/update-metadata'),
            handler: 'update-metadata.handler',
            environment,
            memorySize: 128
        });

        const updateMetadataLambda = new lambda.Function(stack, functionName, lambdaConf);

        secret.grantRead(updateMetadataLambda);

        const rule = new Rule(stack, 'RuleForMetadataUpdate', {
            schedule: Schedule.rate(Duration.minutes(10))
        });
        rule.addTarget(new LambdaFunction(updateMetadataLambda));

        createSubscription(updateMetadataLambda, functionName, appProps.logsDestinationArn, stack);
    }

    private createUpdateDataLambdaForOulu(stack: Stack, vpc: IVpc, lambdaDbSg: ISecurityGroup, appProps: AppProps, secret: ISecret) {
        const functionName = APPLICATION_NAME + '-UpdateData-Oulu';

        const environment: LambdaEnvironment = {};
        environment[SECRET_ID_KEY] = appProps.secretId;
        environment[DatabaseEnvironmentKeys.DB_APPLICATION] = APPLICATION_NAME;
        environment[CountingSitesEnvKeys.DOMAIN_NAME] = 'Oulu';
        environment[CountingSitesEnvKeys.DOMAIN_PREFIX] = 'cs.oulu';

        const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, appProps, {
            functionName,
            code: new lambda.AssetCode('dist/lambda/update-data'),
            handler: 'update-data.handler',
            environment,
            memorySize: 256
        });

        const updateMetadataLambda = new lambda.Function(stack, functionName, lambdaConf);

        secret.grantRead(updateMetadataLambda);

        const rule = new Rule(stack, 'RuleForDataUpdate', {
            schedule: Schedule.rate(Duration.hours(1))
        });
        rule.addTarget(new LambdaFunction(updateMetadataLambda));

        createSubscription(updateMetadataLambda, functionName, appProps.logsDestinationArn, stack);
    }
}