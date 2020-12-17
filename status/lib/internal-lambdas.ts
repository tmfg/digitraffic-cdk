import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Function, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {createSubscription} from "../../common/stack/subscription";
import {Props} from "./app-props";

export function create(stack: Construct, props: Props) {
    const functionName = "Status-UpdateStatuses";
    const lambdaConf = {
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-status'),
        handler: 'lambda-update-status.handler',
        runtime: Runtime.NODEJS_12_X,
        memorySize: 128,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment: {
            APPS: JSON.stringify(props.monitoredApps),
            SECRET_ARN: props.secretsManagerSecretArn
        },
        logRetention: RetentionDays.ONE_YEAR,
    };

    const updateStatusesLambda = new Function(stack, 'UpdateStatuses', lambdaConf);

    const secret = Secret.fromSecretCompleteArn(stack, 'Secret', props.secretsManagerSecretArn);
    secret.grantRead(updateStatusesLambda);

    const rule = new Rule(stack, 'UpdateStatusesRule', {
        schedule: Schedule.rate(Duration.hours(1))
    });
    rule.addTarget(new LambdaFunction(updateStatusesLambda));

    createSubscription(updateStatusesLambda, functionName, props.logsDestinationArn, stack);
}
