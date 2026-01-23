import { basename } from "node:path";
import { Duration } from "aws-cdk-lib";
import type { Metric } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import type { ISecurityGroup, IVpc } from "aws-cdk-lib/aws-ec2";
import type { IRole } from "aws-cdk-lib/aws-iam";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  ApplicationLogLevel,
  Architecture,
  AssetCode,
  Function as AwsFunction,
  Code,
  LoggingFormat,
  Runtime,
  SystemLogLevel,
} from "aws-cdk-lib/aws-lambda";
import { camelCase, startCase } from "es-toolkit";
import { DatabaseEnvironmentKeys } from "../../../database/database.js";
import type { TrafficType } from "../../../types/traffictype.js";
import { EnvKeys } from "../../runtime/environment.js";
import type { AlarmProps } from "./dt-function-alarms.js";
import { DtFunctionAlarms } from "./dt-function-alarms.js";
import type { LambdaEnvironment } from "./lambda-configs.js";
import { createLambdaLogGroup } from "./lambda-log-group.js";
import type { DigitrafficStack } from "./stack.js";

type FunctionFeatures = {
  singleLambda: boolean;
  databaseAccess: boolean;
  secretAccess: boolean;
};

export class FunctionBuilder {
  private readonly _stack: DigitrafficStack;
  private readonly _name: string;

  private description?: string;
  private runtime: Runtime = Runtime.NODEJS_24_X;
  private architecture: Architecture = Architecture.ARM_64;
  private role?: IRole;
  private timeout: Duration = Duration.seconds(60);
  private reservedConcurrentExecutions = 2;
  private memorySize: number = 128;
  private functionName: string;
  private environment: LambdaEnvironment = {};
  private vpc?: IVpc;
  private alarms: DtFunctionAlarms = new DtFunctionAlarms();

  // these will be overridden in constructor, but inspection won't see it, so set some default values.
  private code: Code = Code.fromInline("placeholder");
  private handler: string = "";

  private readonly securityGroups: ISecurityGroup[] = [];
  private readonly policyStatements: PolicyStatement[] = [];
  private readonly allowedActions: string[] = [];

  private readonly _features: FunctionFeatures = {
    singleLambda: false,
    databaseAccess: true,
    secretAccess: true,
  };

  constructor(stack: DigitrafficStack, lambdaName: string) {
    this._name = lambdaName;
    this._stack = stack;

    this.functionName = `${stack.configuration.shortName}-${startCase(camelCase(lambdaName)).replace(/\s/g, "")}`;
    this.environment = {};
    this.vpc = stack.vpc;

    // this calls withHandler as well but with full path
    this.withAssetCode(lambdaName);
    // Remove path from lambda to get module name.
    // e.g. for lambdaName "api/charging-network/v1/operators",
    // moduleName becomes "operators" and handler becomes "operators.handler"
    const moduleName = basename(lambdaName);
    this.withHandler(moduleName);
  }

  /**
   * Creates a new builder with defaults, using the lambdaName as a source for the lambda implementation (dist/lambdaName/lambdaName.js).
   * Database access is given by default.
   */
  public static create(stack: DigitrafficStack, lambdaName: string) {
    return new FunctionBuilder(stack, lambdaName);
  }

  /**
   * Creates a new builder with defaults, but without database or secret access.
   */
  public static plain(stack: DigitrafficStack, lambdaName: string) {
    return new FunctionBuilder(stack, lambdaName)
      .withoutDatabaseAccess()
      .withoutSecretAccess();
  }

  /**
   * Stack only has one lambda.  Default is that it has multiple lambdas.
   */
  public singleLambda(): this {
    this._features.singleLambda = true;

    return this;
  }

  /**
   * Use AssetCode from given path(dist/lambda/${path}).  Default path is lambdaName. Also calls withHandler with the same value.
   */
  public withAssetCode(path: string = this._name): this {
    const lambdaPath = this._features.singleLambda
      ? `dist/lambda/`
      : `dist/lambda/${path}`;

    this.code = new AssetCode(lambdaPath);

    this.withHandler(path);

    return this;
  }

  public withCode(code: Code): this {
    this.code = code;

    return this;
  }

  /**
   * Use given handler(${name}.handler) to run the lambda.  Default value is lambdaName.
   * @param name
   * @param handlerFunctionName
   * @returns
   */
  public withHandler(
    name: string,
    handlerFunctionName: string = "handler",
  ): this {
    this.handler = `${name}.${handlerFunctionName}`;
    return this;
  }

  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  /**
   * Do not grant database access.  Default is with database access.
   */
  public withoutDatabaseAccess(): this {
    this._features.databaseAccess = false;

    return this;
  }

  /**
   * Do not grant secret access.  Default is with secret access.
   */
  public withoutSecretAccess(): this {
    this._features.secretAccess = false;

    return this;
  }

  /**
   * Add given security groups to the lambda.
   */
  public withSecurityGroup(...groups: ISecurityGroup[]): this {
    this.securityGroups.push(...groups);

    return this;
  }

  /**
   * Set memorySize(in MB) for the lambda.  Default is 128 MB.
   */
  public withMemorySize(memorySize: number): this {
    this.memorySize = memorySize;

    return this;
  }

  /**
   * Set runtime for the lambda.  Default is Runtime.NODEJS_24_X.
   */
  public withRuntime(runtime: Runtime): this {
    this.runtime = runtime;

    return this;
  }

  /**
   * Set architecture for the lambda.  Default is Architecture.ARM_64.
   */
  public withArchitecture(architecture: Architecture): this {
    this.architecture = architecture;

    return this;
  }

  /**
   * Set timeout for the lambda.  Default is Duration.seconds(60).
   */
  public withTimeout(timeout: Duration): this {
    this.timeout = timeout;

    return this;
  }

  /**
   * Set reservedConcurrectExecutions for the lambda.  Default is 2.
   */
  public withReservedConcurrentExecutions(executions: number): this {
    this.reservedConcurrentExecutions = executions;

    return this;
  }

  /**
   * Set role for the lambda.  Default is no role.
   */
  public withRole(role: IRole): this {
    this.role = role;

    return this;
  }

  /**
   * Set environment for the lambda.  Default environment comes from the DigitrafficStack and
   * this does not clear it, only adds to the default values.
   */
  public withEnvironment(environment: LambdaEnvironment): this {
    this.environment = { ...this.environment, ...environment };

    return this;
  }

  /**
   * Configure alarms for the lambda. By default, all alarms are added.
   */
  public withAlarms(alarms: DtFunctionAlarms): this {
    this.alarms = alarms;

    return this;
  }

  /**
   * Add a policy statement to the lambda's role.
   */
  public withRolePolicies(...policies: PolicyStatement[]): this {
    this.policyStatements.push(...policies);

    return this;
  }

  /**
   * Add allowed actions to the lambda's role. Creates a policy statement that allows
   * the specified actions on all resources (*).
   */
  public withAllowedActions(...actions: string[]): this {
    this.allowedActions.push(...actions);

    return this;
  }

  private getSecurityGroups(): ISecurityGroup[] {
    if (this._features.databaseAccess) {
      if (!this._stack.lambdaDbSg) {
        throw new Error("Lambda db security group no defined");
      }

      return [...this.securityGroups, this._stack.lambdaDbSg];
    }

    return this.securityGroups;
  }

  public build(): AwsFunction {
    const logGroup = createLambdaLogGroup({
      stack: this._stack,
      functionName: this.functionName,
    });

    const vpcSubnets = this._stack.vpc
      ? {
          subnets: this._stack.vpc.privateSubnets,
        }
      : undefined;

    const securityGroups = this.getSecurityGroups();

    const createdFunction = new AwsFunction(this._stack, this.functionName, {
      vpc: this.vpc,
      vpcSubnets,
      loggingFormat: LoggingFormat.JSON,
      applicationLogLevelV2: ApplicationLogLevel.DEBUG,
      systemLogLevelV2: SystemLogLevel.INFO,
      runtime: this.runtime,
      architecture: this.architecture,
      code: this.code,
      handler: this.handler,
      role: this.role,
      timeout: this.timeout,
      logGroup,
      reservedConcurrentExecutions: this.reservedConcurrentExecutions,
      memorySize: this.memorySize,
      functionName: this.functionName,
      securityGroups,
      environment: this.getEnvironment(),
      description: this.description,
    });

    if (this._features.secretAccess) {
      this._stack.grantSecret(createdFunction);
    }

    this.attachPolicies(createdFunction);

    this.createAlarms(createdFunction);

    return createdFunction;
  }

  private attachPolicies(lambda: AwsFunction): void {
    this.validateNoWildcardActions();

    for (const policyStatement of this.policyStatements) {
      lambda.addToRolePolicy(policyStatement);
    }

    if (this.allowedActions.length > 0) {
      lambda.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: this.allowedActions,
          resources: ["*"],
        }),
      );
    }
  }

  private validateNoWildcardActions(): void {
    if (this.allowedActions.includes("*")) {
      throw new Error(
        `Lambda ${this.functionName} cannot use wildcard action "*" in withAllowedActions. Please specify explicit actions.`,
      );
    }
  }

  private getEnvironment(): LambdaEnvironment {
    let environment = {};

    if (this._features.secretAccess) {
      environment = {
        ...environment,
        [EnvKeys.SECRET_ID]: this._stack.configuration.secretId,
      };
    }

    if (this._features.databaseAccess) {
      environment = {
        ...environment,
        [DatabaseEnvironmentKeys.DB_APPLICATION]:
          this._stack.configuration.shortName,
      };
    }

    return { ...environment, ...this.environment };
  }

  private createAlarms(lambda: AwsFunction): void {
    const alarmSnsAction = new SnsAction(this._stack.alarmTopic);
    const warningSnsAction = new SnsAction(this._stack.warningTopic);
    const trafficType = this._stack.configuration.trafficType;
    const production = this._stack.configuration.production;

    if (this.alarms.durationAlarm) {
      this.createAlarm(
        lambda,
        lambda.metricDuration().with({ statistic: "max" }),
        "Duration",
        "Duration alarm",
        `Duration has exceeded ${this.timeout.toSeconds()} seconds`,
        trafficType,
        production ? alarmSnsAction : warningSnsAction,
        this.timeout.toMilliseconds(),
        this.alarms.durationAlarm,
      );
    }
    if (this.alarms.durationWarning) {
      this.createAlarm(
        lambda,
        lambda.metricDuration().with({ statistic: "max" }),
        "Duration-Warning",
        "Duration warning",
        `Duration is 85 % of max ${this.timeout.toSeconds()} seconds`,
        trafficType,
        warningSnsAction,
        this.timeout.toMilliseconds() * 0.85,
        this.alarms.durationWarning,
      );
    }

    if (this.alarms.errorAlarms) {
      this.createAlarm(
        lambda,
        lambda.metricErrors(),
        "Errors",
        "Errors alarm",
        "Invocations did not succeed",
        trafficType,
        production ? alarmSnsAction : warningSnsAction,
        1,
        this.alarms.errorAlarms,
      );
    }

    if (this.alarms.throttleAlarm) {
      this.createAlarm(
        lambda,
        lambda.metricThrottles(),
        "Throttles",
        "Throttles alarm",
        "Has throttled",
        trafficType,
        production ? alarmSnsAction : warningSnsAction,
        1,
        this.alarms.throttleAlarm,
      );
    }
  }

  private createAlarm(
    lambda: AwsFunction,
    metric: Metric,
    alarmId: string,
    alarmName: string,
    alarmDescription: string,
    trafficType: TrafficType | null,
    alarmSnsAction: SnsAction,
    threshold: number,
    alarmProps: AlarmProps,
  ): void {
    metric
      .createAlarm(this._stack, `${lambda.node.id}-${alarmId}`, {
        alarmName: `${
          trafficType ?? ""
        } ${this._stack.stackName} ${this.functionName} ${alarmName}`.trim(),
        alarmDescription,
        threshold: alarmProps.threshold ?? threshold,
        evaluationPeriods: alarmProps.evaluationPeriods,
        datapointsToAlarm: alarmProps.datapointsToAlarm,
        comparisonOperator: alarmProps.comparisonOperator,
      })
      .addAlarmAction(alarmSnsAction);
  }
}
