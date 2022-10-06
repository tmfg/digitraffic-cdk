import {Duration, Stack} from "aws-cdk-lib";
import {AssetCode, FunctionProps, Runtime} from "aws-cdk-lib/aws-lambda";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {ISecret, Secret} from "aws-cdk-lib/aws-secretsmanager";
import {Rule, Schedule} from "aws-cdk-lib/aws-events";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";
import {createSubscription} from "@digitraffic/common/aws/infra/stack/subscription";
import {Props} from "./app-props";
import {StatusEnvKeys} from "./keys";
import {ITopic} from "aws-cdk-lib/aws-sns";
import {MonitoredFunction} from "@digitraffic/common/aws/infra/stack/monitoredfunction";
import {TrafficType} from "@digitraffic/common/types/traffictype";


export function create(stack: Stack, alarmSnsTopic: ITopic, warningSnsTopic: ITopic, props: Props) {
    const secret = Secret.fromSecretCompleteArn(stack, 'Secret', props.secretsManagerSecretArn);
    createUpdateStatusesLambda(
        secret, alarmSnsTopic, warningSnsTopic, stack, props,
    );
    createHandleMaintenanceLambda(
        secret, alarmSnsTopic, warningSnsTopic, stack, props,
    );
    createCheckComponentStatesLambda(
        secret, alarmSnsTopic, warningSnsTopic, stack, props,
    );
}

function createUpdateStatusesLambda(
    secret: ISecret,
    alarmSnsTopic: ITopic,
    warningSnsTopic: ITopic,
    stack: Stack,
    props: Props,
) {

    const environment: any = {};
    environment[StatusEnvKeys.APPS] = JSON.stringify(props.monitoredApps);
    environment[StatusEnvKeys.SECRET_ID] = props.secretsManagerSecretArn;
    environment[StatusEnvKeys.CHECK_TIMEOUT_SECONDS] = String(props.nodePingTimeoutSeconds);
    environment[StatusEnvKeys.INTERVAL_MINUTES] = String(props.nodePingCheckInterval);

    const functionName = "Status-UpdateStatuses";
    const lambdaConf: FunctionProps = {
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-status'),
        handler: 'lambda-update-status.handler',
        runtime: Runtime.NODEJS_14_X,
        memorySize: 128,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment,
        logRetention: RetentionDays.ONE_YEAR,
        reservedConcurrentExecutions: 1,
    };

    const lambda = new MonitoredFunction(
        stack,
        'UpdateStatuses',
        lambdaConf,
        alarmSnsTopic,
        warningSnsTopic,
        true,
        TrafficType.OTHER,
    );

    secret.grantRead(lambda);

    const rule = new Rule(stack, 'UpdateStatusesRule', {
        schedule: Schedule.rate(Duration.hours(1)),
    });
    rule.addTarget(new LambdaFunction(lambda));

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}

function createHandleMaintenanceLambda(
    secret: ISecret,
    alarmSnsTopic: ITopic,
    warningSnsTopic: ITopic,
    stack: Stack,
    props: Props,
) {

    const functionName = "Status-HandleMaintenance";
    const lambdaConf: FunctionProps = {
        functionName: functionName,
        code: new AssetCode('dist/lambda/handle-maintenance'),
        handler: 'lambda-handle-maintenance.handler',
        runtime: Runtime.NODEJS_14_X,
        memorySize: 128,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment: {
            STATUSPAGE_URL: props.statusPageUrl,
            SECRET_ARN: props.secretsManagerSecretArn,
        },
        logRetention: RetentionDays.ONE_YEAR,
        reservedConcurrentExecutions: 1,
    };

    const lambda = new MonitoredFunction(
        stack,
        'HandleMaintenance',
        lambdaConf,
        alarmSnsTopic,
        warningSnsTopic,
        true,
        TrafficType.OTHER,
    );

    secret.grantRead(lambda);

    const rule = new Rule(stack, 'HandleMaintenanceRule', {
        schedule: Schedule.rate(Duration.minutes(1)),
    });
    rule.addTarget(new LambdaFunction(lambda));

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}


function createCheckComponentStatesLambda(
    secret: ISecret,
    alarmSnsTopic: ITopic,
    warningSnsTopic: ITopic,
    stack: Stack,
    props: Props,
) {

    const functionName = "Status-CheckComponentStates";
    const lambdaConf: FunctionProps = {
        functionName: functionName,
        code: new AssetCode('dist/lambda/check-component-states'),
        handler: 'lambda-check-component-states.handler',
        runtime: Runtime.NODEJS_14_X,
        memorySize: 128,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment: {
            STATUSPAGE_URL: props.statusPageUrl,
            SECRET_ARN: props.secretsManagerSecretArn,
        },
        logRetention: RetentionDays.ONE_YEAR,
        reservedConcurrentExecutions: 1,
    };

    const lambda = new MonitoredFunction(
        stack,
        'CheckComponentStates',
        lambdaConf,
        alarmSnsTopic,
        warningSnsTopic,
        true,
        TrafficType.OTHER,
    );

    secret.grantRead(lambda);

    const rule = new Rule(stack, 'CheckComponentStatesRule', {
        schedule: Schedule.rate(Duration.hours(1)),
    });
    rule.addTarget(new LambdaFunction(lambda));

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}
