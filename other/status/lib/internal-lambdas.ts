import { Duration, Stack } from "aws-cdk-lib";
import { AssetCode, FunctionProps, Runtime } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { createSubscription } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { Props } from "./app-props";
import { StatusEnvKeys } from "./keys";
import { ITopic } from "aws-cdk-lib/aws-sns";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { TrafficType } from "@digitraffic/common/dist/types/traffictype";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { LambdaEnvironment } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";

export function create(
    stack: Stack,
    alarmSnsTopic: ITopic,
    warningSnsTopic: ITopic,
    props: Props
) {
    const secret = Secret.fromSecretCompleteArn(
        stack,
        "Secret",
        props.secretsManagerSecretArn
    );
    createUpdateStatusesLambda(
        secret,
        alarmSnsTopic,
        warningSnsTopic,
        stack,
        props
    );
    createHandleMaintenanceLambda(
        secret,
        alarmSnsTopic,
        warningSnsTopic,
        stack,
        props
    );
    createCheckComponentStatesLambda(
        secret,
        alarmSnsTopic,
        warningSnsTopic,
        stack,
        props
    );
}

function createUpdateStatusesLambda(
    secret: ISecret,
    alarmSnsTopic: ITopic,
    warningSnsTopic: ITopic,
    stack: Stack,
    props: Props
) {
    const environment: LambdaEnvironment = {};
    environment[StatusEnvKeys.APPS] = JSON.stringify(props.monitoredApps);
    environment[StatusEnvKeys.SECRET_ID] = props.secretsManagerSecretArn;
    environment[StatusEnvKeys.CHECK_TIMEOUT_SECONDS] =
        props.nodePingTimeoutSeconds.toString();
    environment[StatusEnvKeys.INTERVAL_MINUTES] =
        props.nodePingCheckInterval.toString();

    const functionName = "Status-UpdateStatuses";
    const lambdaConf: FunctionProps = {
        functionName: functionName,
        code: new AssetCode("dist/lambda/update-status"),
        handler: "lambda-update-status.handler",
        runtime: Runtime.NODEJS_16_X,
        memorySize: 128,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment,
        logRetention: RetentionDays.ONE_YEAR,
        reservedConcurrentExecutions: 1,
    };

    const lambda = new MonitoredFunction(
        stack,
        "UpdateStatuses",
        lambdaConf,
        alarmSnsTopic,
        warningSnsTopic,
        true,
        TrafficType.OTHER
    );

    secret.grantRead(lambda);

    Scheduler.everyHour(stack, "UpdateStatusesRule", lambda);

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}

function createHandleMaintenanceLambda(
    secret: ISecret,
    alarmSnsTopic: ITopic,
    warningSnsTopic: ITopic,
    stack: Stack,
    props: Props
) {
    const functionName = "Status-HandleMaintenance";
    const lambdaConf: FunctionProps = {
        functionName: functionName,
        code: new AssetCode("dist/lambda/handle-maintenance"),
        handler: "lambda-handle-maintenance.handler",
        runtime: Runtime.NODEJS_16_X,
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
        "HandleMaintenance",
        lambdaConf,
        alarmSnsTopic,
        warningSnsTopic,
        true,
        TrafficType.OTHER
    );

    secret.grantRead(lambda);

    Scheduler.everyMinute(stack, "HandleMaintenanceRule", lambda);

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}

function createCheckComponentStatesLambda(
    secret: ISecret,
    alarmSnsTopic: ITopic,
    warningSnsTopic: ITopic,
    stack: Stack,
    props: Props
) {
    const functionName = "Status-CheckComponentStates";
    const lambdaConf: FunctionProps = {
        functionName: functionName,
        code: new AssetCode("dist/lambda/check-component-states"),
        handler: "lambda-check-component-states.handler",
        runtime: Runtime.NODEJS_16_X,
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
        "CheckComponentStates",
        lambdaConf,
        alarmSnsTopic,
        warningSnsTopic,
        true,
        TrafficType.OTHER
    );

    secret.grantRead(lambda);

    Scheduler.everyHour(stack, "CheckComponentStatesRule", lambda);

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}
