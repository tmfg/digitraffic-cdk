import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import type { LambdaEnvironment } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { createLambdaLogGroup } from "@digitraffic/common/dist/aws/infra/stack/lambda-log-group";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { TrafficType } from "@digitraffic/common/dist/types/traffictype";
import type { Stack } from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import type { FunctionProps } from "aws-cdk-lib/aws-lambda";
import { AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import type { ITopic } from "aws-cdk-lib/aws-sns";
import type { Props } from "./app-props.js";
import { StatusEnvKeys } from "./keys.js";

export function create(
  stack: Stack,
  alarmSnsTopic: ITopic,
  warningSnsTopic: ITopic,
  configuration: Props,
): void {
  const secret = Secret.fromSecretNameV2(
    stack,
    "Secret",
    configuration.secretId,
  );
  const shortName = "status";
  createUpdateStatusesLambda(
    secret,
    alarmSnsTopic,
    warningSnsTopic,
    stack,
    shortName,
    configuration,
  );
  createHandleMaintenanceLambda(
    secret,
    alarmSnsTopic,
    warningSnsTopic,
    stack,
    shortName,
    configuration,
  );
  createCheckComponentStatesLambda(
    secret,
    alarmSnsTopic,
    warningSnsTopic,
    stack,
    shortName,
    configuration,
  );
  createTestSlackNotifyLambda(
    secret,
    alarmSnsTopic,
    warningSnsTopic,
    stack,
    shortName,
    configuration,
  );
}

function createCommonEnv(props: Props): LambdaEnvironment {
  return {
    [StatusEnvKeys.SECRET_ID]: props.secretId,
    [StatusEnvKeys.C_STATE_PAGE_URL]: props.cStatePageUrl,
    [StatusEnvKeys.CHECK_TIMEOUT_SECONDS]:
      props.nodePingTimeoutSeconds.toString(),
    [StatusEnvKeys.INTERVAL_MINUTES]: props.nodePingCheckInterval.toString(),
    [StatusEnvKeys.GITHUB_OWNER]: props.gitHubOwner.toString(),
    [StatusEnvKeys.GITHUB_REPO]: props.gitHubRepo.toString(),
    [StatusEnvKeys.GITHUB_BRANCH]: props.gitHubBranch.toString(),
    [StatusEnvKeys.GITHUB_WORKFLOW_FILE]: props.gitHubWorkflowFile.toString(),
    [StatusEnvKeys.GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE]:
      props.gitHubUpdateMaintenanceWorkflowFile.toString(),
  };
}

function createUpdateStatusesLambda(
  secret: ISecret,
  alarmSnsTopic: ITopic,
  warningSnsTopic: ITopic,
  stack: Stack,
  shortName: string,
  props: Props,
): void {
  const environment: LambdaEnvironment = createCommonEnv(props);

  const functionName = "Status-UpdateStatuses";
  const logGroup = createLambdaLogGroup({ stack, functionName, shortName });
  const lambdaConf: FunctionProps = {
    functionName: functionName,
    code: new AssetCode("dist/lambda/update-status"),
    handler: "lambda-update-status.handler",
    runtime: Runtime.NODEJS_22_X,
    memorySize: 256,
    timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
    environment,
    logGroup: logGroup,
    reservedConcurrentExecutions: 1,
    description:
      "Updates NodePing checks to correspond OpenAPI Specifications and monitored-apps config",
  };

  const lambda = new MonitoredFunction(
    stack,
    "UpdateStatuses",
    lambdaConf,
    alarmSnsTopic,
    warningSnsTopic,
    true,
    TrafficType.OTHER,
  );

  secret.grantRead(lambda);

  Scheduler.everyHour(stack, "UpdateStatusesRule", lambda);
}

function createHandleMaintenanceLambda(
  secret: ISecret,
  alarmSnsTopic: ITopic,
  warningSnsTopic: ITopic,
  stack: Stack,
  shortName: string,
  props: Props,
): void {
  const functionName = "Status-HandleMaintenance" as const;

  const environment = createCommonEnv(props);
  const logGroup = createLambdaLogGroup({ stack, functionName, shortName });

  const lambdaConf: FunctionProps = {
    functionName: functionName,
    code: new AssetCode("dist/lambda/handle-maintenance"),
    handler: "lambda-handle-maintenance.handler",
    runtime: Runtime.NODEJS_22_X,
    memorySize: 256,
    timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
    environment,
    logGroup: logGroup,
    reservedConcurrentExecutions: 1,
    description:
      "Checks StatusPage maintenances and disables NodePing checks if maintenance is active or re-enables checks if maintenance is over",
  };

  const lambda = new MonitoredFunction(
    stack,
    "HandleMaintenance",
    lambdaConf,
    alarmSnsTopic,
    warningSnsTopic,
    true,
    TrafficType.OTHER,
  );

  secret.grantRead(lambda);

  Scheduler.everyMinute(stack, "HandleMaintenanceRule", lambda);
}

function createCheckComponentStatesLambda(
  secret: ISecret,
  alarmSnsTopic: ITopic,
  warningSnsTopic: ITopic,
  stack: Stack,
  shortName: string,
  props: Props,
): void {
  const functionName = "Status-CheckComponentStates";
  const environment = createCommonEnv(props);
  const logGroup = createLambdaLogGroup({ stack, functionName, shortName });
  const lambdaConf: FunctionProps = {
    functionName: functionName,
    code: new AssetCode("dist/lambda/check-component-states"),
    handler: "lambda-check-component-states.handler",
    runtime: Runtime.NODEJS_22_X,
    memorySize: 256,
    timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
    environment,
    logGroup: logGroup,
    reservedConcurrentExecutions: 1,
    description:
      "Checks current status of StatusPage and NodePing and sends report of differences to Slack",
  };

  const lambda = new MonitoredFunction(
    stack,
    "CheckComponentStates",
    lambdaConf,
    alarmSnsTopic,
    warningSnsTopic,
    true,
    TrafficType.OTHER,
  );

  secret.grantRead(lambda);

  Scheduler.everyHour(stack, "CheckComponentStatesRule", lambda);
}

function createTestSlackNotifyLambda(
  secret: ISecret,
  alarmSnsTopic: ITopic,
  warningSnsTopic: ITopic,
  stack: Stack,
  shortName: string,
  props: Props,
): void {
  const functionName = "Status-TestSlackNotify" as const;

  const environment = createCommonEnv(props);

  const logGroup = createLambdaLogGroup({ stack, functionName, shortName });

  const lambdaConf: FunctionProps = {
    functionName: functionName,
    code: new AssetCode("dist/lambda/test-slack-notify"),
    handler: "lambda-test-slack-notify.handler",
    runtime: Runtime.NODEJS_22_X,
    memorySize: 128,
    timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
    environment,
    logGroup: logGroup,
    reservedConcurrentExecutions: 1,
    description: "Sends test message to Slack",
  };

  const lambda = new MonitoredFunction(
    stack,
    "TestSlackNotify",
    lambdaConf,
    alarmSnsTopic,
    warningSnsTopic,
    true,
    TrafficType.OTHER,
  );

  secret.grantRead(lambda);
}
