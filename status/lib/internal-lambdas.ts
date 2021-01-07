import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Function, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {ISecret, Secret} from "@aws-cdk/aws-secretsmanager";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {createSubscription} from "../../common/stack/subscription";
import {Props} from "./app-props";

function createUpdateStatusesLambda(secret: ISecret, stack: Construct, props: Props) {
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

    const lambda = new Function(stack, 'UpdateStatuses', lambdaConf);

    secret.grantRead(lambda);

    const rule = new Rule(stack, 'UpdateStatusesRule', {
        schedule: Schedule.rate(Duration.hours(1))
    });
    rule.addTarget(new LambdaFunction(lambda));

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}

function createHandleMaintenanceLambda(secret: ISecret, stack: Construct, props: Props) {
    const functionName = "Status-HandleMaintenance";
    const lambdaConf = {
        functionName: functionName,
        code: new AssetCode('dist/lambda/handle-maintenance'),
        handler: 'lambda-handle-maintenance.handler',
        runtime: Runtime.NODEJS_12_X,
        memorySize: 128,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment: {
            STATUSPAGE_URL: props.statusPageUrl,
            SECRET_ARN: props.secretsManagerSecretArn
        },
        logRetention: RetentionDays.ONE_YEAR,
    };

    const lambda = new Function(stack, 'HandleMaintenance', lambdaConf);

    secret.grantRead(lambda);

    const rule = new Rule(stack, 'HandleMaintenanceRule', {
        schedule: Schedule.rate(Duration.minutes(1))
    });
    rule.addTarget(new LambdaFunction(lambda));

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}

export function create(stack: Construct, props: Props) {
    const secret = Secret.fromSecretCompleteArn(stack, 'Secret', props.secretsManagerSecretArn);

    createUpdateStatusesLambda(secret, stack, props);
    createHandleMaintenanceLambda(secret, stack, props);
}
