import { Duration } from "aws-cdk-lib";
import type { IVpc, SubnetSelection } from "aws-cdk-lib/aws-ec2";
import type { Role } from "aws-cdk-lib/aws-iam";
import type { Code, FunctionProps } from "aws-cdk-lib/aws-lambda";
import { Architecture, AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import type { ILogGroup } from "aws-cdk-lib/aws-logs";
import type { MonitoredFunctionAlarmProps } from "./monitoredfunction.js";
import type { DigitrafficStack } from "./stack.js";

export type LambdaEnvironment = Record<string, string>;

export type DBLambdaEnvironment = LambdaEnvironment & {
  SECRET_ID?: string;
  DB_APPLICATION: string;
};

export function databaseFunctionProps(
  stack: DigitrafficStack,
  environment: LambdaEnvironment,
  lambdaName: string,
  simpleLambdaName: string,
  logGroup: ILogGroup,
  config?: Partial<FunctionParameters>,
): FunctionProps {
  const vpcSubnets = stack.vpc
    ? {
        subnets: stack.vpc.privateSubnets,
      }
    : undefined;

  return {
    ...lambdaFunctionProps(
      stack,
      environment,
      lambdaName,
      simpleLambdaName,
      logGroup,
      config,
    ),
    ...{
      vpc: stack.vpc ?? undefined,
      vpcSubnets,
      securityGroup: stack.lambdaDbSg ?? undefined,
    },
  };
}

export function lambdaFunctionProps(
  _: DigitrafficStack,
  environment: LambdaEnvironment,
  lambdaName: string,
  simpleLambdaName: string,
  logGroup: ILogGroup,
  config?: Partial<FunctionParameters>,
): FunctionProps {
  return {
    runtime: config?.runtime ?? Runtime.NODEJS_22_X,
    architecture: config?.architecture ?? Architecture.ARM_64,
    memorySize: config?.memorySize ?? 128,
    functionName: lambdaName,
    role: config?.role,
    timeout: Duration.seconds(config?.timeout ?? 60),
    logGroup: logGroup,
    reservedConcurrentExecutions: config?.reservedConcurrentExecutions ?? 2,
    code: getAssetCode(simpleLambdaName, config?.singleLambda ?? false),
    handler: `${simpleLambdaName}.handler`,
    environment,
  };
}

function getAssetCode(
  simpleLambdaName: string,
  isSingleLambda: boolean,
): AssetCode {
  const lambdaPath = isSingleLambda
    ? `dist/lambda/`
    : `dist/lambda/${simpleLambdaName}`;

  return new AssetCode(lambdaPath);
}

export function defaultLambdaConfiguration(
  config: FunctionParameters,
): FunctionProps {
  const props: FunctionProps = {
    runtime: Runtime.NODEJS_22_X,
    memorySize: config.memorySize ?? 128,
    functionName: config.functionName,
    handler: config.handler,
    environment: config.environment ?? {},
    logGroup: config.logGroup,
    reservedConcurrentExecutions: config.reservedConcurrentExecutions,
    code: config.code,
    role: config.role,
    timeout: Duration.seconds(config.timeout ?? 10),
  };
  if (config.vpc) {
    return {
      ...props,
      ...{
        vpc: config.vpc,
        vpcSubnets: {
          subnets: config.vpc.privateSubnets,
        },
      },
    };
  }
  return props;
}

export interface FunctionParameters {
  memorySize?: number;
  timeout?: number;
  functionName?: string;
  code: Code;
  handler: string;
  logGroup: ILogGroup;
  readOnly?: boolean;
  environment?: Record<string, string>;
  reservedConcurrentExecutions?: number;
  role?: Role;
  vpc?: IVpc;
  vpcSubnets?: SubnetSelection;
  runtime?: Runtime;
  architecture?: Architecture;
  singleLambda?: boolean;
}

export type MonitoredFunctionParameters = FunctionParameters & {
  readonly durationAlarmProps?: MonitoredFunctionAlarmProps;
  readonly durationWarningProps?: MonitoredFunctionAlarmProps;
  readonly errorAlarmProps?: MonitoredFunctionAlarmProps;
  readonly throttleAlarmProps?: MonitoredFunctionAlarmProps;
};
