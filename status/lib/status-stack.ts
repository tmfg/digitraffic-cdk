import {Stack, Construct, StackProps, Duration} from '@aws-cdk/core';
import {Props} from './app-props'
import {AssetCode, Function, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {createSubscription} from "../../common/stack/subscription";
import {Secret} from "@aws-cdk/aws-secretsmanager";

export class StatusStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const functionName = "Status-UpdateStatuses";
        const lambdaConf = {
            functionName: functionName,
            code: new AssetCode('dist/lambda'),
            handler: 'lambda-update-status.handler',
            runtime: Runtime.NODEJS_12_X,
            memorySize: 1024,
            timeout: Duration.seconds(appProps.defaultLambdaDurationSeconds),
            environment: {
                APPS: JSON.stringify(appProps.monitoredApps),
                SECRET_ARN: appProps.secretsManagerSecretArn
            },
            logRetention: RetentionDays.ONE_YEAR,
        };

        const updateStatusesLambda = new Function(this, 'UpdateStatuses', lambdaConf);

        const secret = Secret.fromSecretCompleteArn(this, 'Secret', appProps.secretsManagerSecretArn);
        secret.grantRead(updateStatusesLambda);

        const rule = new Rule(this, 'UpdateStatusesRule', {
            schedule: Schedule.rate(Duration.hours(1))
        });
        rule.addTarget(new LambdaFunction(updateStatusesLambda));

        createSubscription(updateStatusesLambda, functionName, appProps.logsDestinationArn, this);
    }
}
