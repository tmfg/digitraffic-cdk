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
    configuration: Props
): void {
    const secret = Secret.fromSecretNameV2(stack, "Secret", configuration.secretId);
    createUpdateStatusesLambda(secret, alarmSnsTopic, warningSnsTopic, stack, configuration);
    createHandleMaintenanceLambda(secret, alarmSnsTopic, warningSnsTopic, stack, configuration);
    createCheckComponentStatesLambda(secret, alarmSnsTopic, warningSnsTopic, stack, configuration);
}

function createCommonEnv(props: Props): LambdaEnvironment {
    return {
        [StatusEnvKeys.SECRET_ID]: props.secretId,
        [StatusEnvKeys.STATUSPAGE_URL]: props.statusPageUrl,
        [StatusEnvKeys.C_STATE_PAGE_URL]: props.cStatePageUrl,
        [StatusEnvKeys.CHECK_TIMEOUT_SECONDS]: props.nodePingTimeoutSeconds.toString(),
        [StatusEnvKeys.INTERVAL_MINUTES]: props.nodePingCheckInterval.toString()
    };
}

function createUpdateStatusesLambda(
    secret: ISecret,
    alarmSnsTopic: ITopic,
    warningSnsTopic: ITopic,
    stack: Stack,
    props: Props
): void {
    const environment: LambdaEnvironment = createCommonEnv(props);
    environment[StatusEnvKeys.APPS] = JSON.stringify(props.monitoredApps);
    environment[StatusEnvKeys.GITHUB_OWNER] = props.gitHubOwner;
    environment[StatusEnvKeys.GITHUB_REPO] = props.gitHubRepo;
    environment[StatusEnvKeys.GITHUB_BRANCH] = props.gitHubBranch;
    environment[StatusEnvKeys.GITHUB_WORKFLOW_FILE] = props.gitHubWorkflowFile;

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
        reservedConcurrentExecutions: 1
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
): void {
    const functionName = "Status-HandleMaintenance" as const;

    const environment = createCommonEnv(props);

    const lambdaConf: FunctionProps = {
        functionName: functionName,
        code: new AssetCode("dist/lambda/handle-maintenance"),
        handler: "lambda-handle-maintenance.handler",
        runtime: Runtime.NODEJS_16_X,
        memorySize: 128,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment,
        logRetention: RetentionDays.ONE_YEAR,
        reservedConcurrentExecutions: 1
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
): void {
    const functionName = "Status-CheckComponentStates";
    const environment = createCommonEnv(props);
    const lambdaConf: FunctionProps = {
        functionName: functionName,
        code: new AssetCode("dist/lambda/check-component-states"),
        handler: "lambda-check-component-states.handler",
        runtime: Runtime.NODEJS_16_X,
        memorySize: 128,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment,
        logRetention: RetentionDays.ONE_YEAR,
        reservedConcurrentExecutions: 1
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
