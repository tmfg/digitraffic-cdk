import { App, Duration, Stack, type StackProps } from "aws-cdk-lib";
import { Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import * as events from "aws-cdk-lib/aws-events";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import {
  AnyPrincipal,
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  AssetCode,
  Function,
  type FunctionProps,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { createLambdaLogGroup } from "@digitraffic/common/dist/aws/infra/stack/lambda-log-group";
import * as s3 from "aws-cdk-lib/aws-s3";
import { transportType } from "./constants.js";

export interface Props {
  readonly openSearchVPCEndpoint: string;
  readonly openSearchHost: string;
  readonly openSearchLambdaRoleArn: string;
  readonly slackWebhook: string;
  readonly mysql: {
    readonly password: string;
    readonly database: string;
    readonly host: string;
    readonly user: string;
  };
  readonly allowedIpAddresses: string[];
  readonly rdsSecurityGroupId: string;
  readonly marineAccountName: string;
  readonly railAccountName: string;
  readonly roadAccountName: string;
  readonly osIndex: string;
  readonly visualizationsBucketName: string;
}

export class OsKeyFiguresStack extends Stack {
  constructor(
    app: App,
    id: string,
    osKeyFiguresProps: Props,
    props?: StackProps,
  ) {
    super(app, id, props);
    // vpc also used by stack UpdateOSMonitorsProd since it requires OS access
    const vpc = this.createVpc();

    const collectOsKeyFiguresLambdaSg = this.createCollectOsKeyFiguresLambda(
      osKeyFiguresProps,
      vpc,
    );
    const createKeyFigureVisualizationsLambdaSg = this
      .createVisualizationsLambda(osKeyFiguresProps, vpc);

    const rdsSg = SecurityGroup.fromSecurityGroupId(
      this,
      "DatabaseSG",
      osKeyFiguresProps.rdsSecurityGroupId,
    );
    rdsSg.addIngressRule(collectOsKeyFiguresLambdaSg, Port.tcp(3306));
    rdsSg.addIngressRule(createKeyFigureVisualizationsLambdaSg, Port.tcp(3306));
  }

  private createVisualizationsLambda(
    osKeyFiguresProps: Props,
    vpc: Vpc,
  ): SecurityGroup {
    const lambdaRole = new Role(this, "CreateKeyFigureVisualizationsRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      roleName: "CreateKeyFigureVisualizationsRole",
    });

    const lambdaSecurityGroup = new SecurityGroup(
      this,
      "CreateKeyFigureVisualizationsSecurityGroup",
      {
        vpc,
        description: "Security group for CreateKeyFigureVisualizations",
        allowAllOutbound: true,
      },
    );

    const htmlBucket = new s3.Bucket(this, "os-key-figure-visualizations", {
      versioned: false,
    });

    htmlBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        principals: [new AnyPrincipal()],
        resources: [htmlBucket.bucketArn + "/*"],
        conditions: {
          IpAddress: {
            "aws:SourceIp": osKeyFiguresProps.allowedIpAddresses,
          },
        },
      }),
    );

    lambdaRole.addToPolicy(
      new PolicyStatement({
        actions: ["s3:PutObject", "s3:PutObjectAcl"],
        resources: ["*", htmlBucket.bucketArn + "/*"],
      }),
    );

    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaVPCAccessExecutionRole",
      ),
    );

    const functionName = "CreateKeyFigureVisualizations";
    const logGroup = createLambdaLogGroup({stack: this, shortName: 'OSKeyFigures', functionName});
    const lambdaConf: FunctionProps = {
      role: lambdaRole,
      functionName: functionName,
      code: new AssetCode("dist/lambda"),
      handler: "create-visualizations.handler",
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.minutes(15),
      logGroup: logGroup,
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      memorySize: 512,
      environment: {
        MYSQL_ENDPOINT: osKeyFiguresProps.mysql.host,
        MYSQL_USERNAME: osKeyFiguresProps.mysql.user,
        MYSQL_PASSWORD: osKeyFiguresProps.mysql.password,
        MYSQL_DATABASE: osKeyFiguresProps.mysql.database,
        SLACK_WEBHOOK: osKeyFiguresProps.slackWebhook,
        BUCKET_NAME: osKeyFiguresProps.visualizationsBucketName,
      },
    };
    const createKeyFigureVisualizationsLambda = new Function(
      this,
      functionName,
      lambdaConf,
    );

    const rule = new Rule(this, "create visualizations dummy", {
      schedule: Schedule.expression("cron(0 5 1 * ? *)"),
    });

    const target = new LambdaFunction(createKeyFigureVisualizationsLambda);
    rule.addTarget(target);

    return lambdaSecurityGroup;
  }

  private createCollectOsKeyFiguresLambda(
    osKeyFiguresProps: Props,
    vpc: Vpc,
  ): SecurityGroup {
    const lambdaRole = new Role(this, "CollectOsKeyFiguresRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      roleName: "CollectOsKeyFiguresRole",
    });

    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaVPCAccessExecutionRole",
      ),
    );

    const lambdaSecurityGroup = new SecurityGroup(
      this,
      "CollectOsKeyFiguresSecurityGroup",
      {
        vpc,
        description: "Security group for CollectOsKeyFigures",
        allowAllOutbound: true,
      },
    );

    const functionName = "CollectOsKeyFigures";
    const logGroup = createLambdaLogGroup({stack: this, shortName: 'OSKeyFigures', functionName});
    const lambdaConf: FunctionProps = {
      role: lambdaRole,
      functionName: functionName,
      code: new AssetCode("dist/lambda"),
      handler: "collect-os-key-figures.handler",
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.minutes(15),
      logGroup: logGroup,
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      memorySize: 512,
      environment: {
        ROLE: osKeyFiguresProps.openSearchLambdaRoleArn,
        OS_HOST: osKeyFiguresProps.openSearchHost,
        OS_VPC_ENDPOINT: osKeyFiguresProps.openSearchVPCEndpoint,
        OS_INDEX: osKeyFiguresProps.osIndex,
        MYSQL_ENDPOINT: osKeyFiguresProps.mysql.host,
        MYSQL_USERNAME: osKeyFiguresProps.mysql.user,
        MYSQL_PASSWORD: osKeyFiguresProps.mysql.password,
        MYSQL_DATABASE: osKeyFiguresProps.mysql.database,
        MARINE_ACCOUNT_NAME: osKeyFiguresProps.marineAccountName,
        RAIL_ACCOUNT_NAME: osKeyFiguresProps.railAccountName,
        ROAD_ACCOUNT_NAME: osKeyFiguresProps.roadAccountName,
      },
    };

    const collectOsKeyFiguresLambda = new Function(
      this,
      functionName,
      lambdaConf,
    );

    collectOsKeyFiguresLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["sts:AssumeRole"],
        resources: [osKeyFiguresProps.openSearchLambdaRoleArn],
      }),
    );

    const rule = new Rule(this, "collect *", {
      schedule: Schedule.expression("cron(0 3 1 * ? *)"),
    });
    rule.addTarget(
      new LambdaFunction(collectOsKeyFiguresLambda, {
        event: events.RuleTargetInput.fromObject({
          TRANSPORT_TYPE: transportType.ALL,
        }),
      }),
    );

    const rule2 = new Rule(this, "collect rail", {
      schedule: Schedule.expression("cron(15 3 1 * ? *)"),
    });
    rule2.addTarget(
      new LambdaFunction(collectOsKeyFiguresLambda, {
        event: events.RuleTargetInput.fromObject({
          TRANSPORT_TYPE: transportType.RAIL,
        }),
      }),
    );

    const rule3 = new Rule(this, "collect marine", {
      schedule: Schedule.expression("cron(30 3 1 * ? *)"),
    });
    rule3.addTarget(
      new LambdaFunction(collectOsKeyFiguresLambda, {
        event: events.RuleTargetInput.fromObject({
          TRANSPORT_TYPE: transportType.MARINE,
        }),
      }),
    );

    const rule1 = new Rule(this, "collect road 1", {
      schedule: Schedule.expression("cron(45 3 1 * ? *)"),
    });
    rule1.addTarget(
      new LambdaFunction(collectOsKeyFiguresLambda, {
        event: events.RuleTargetInput.fromObject({
          TRANSPORT_TYPE: transportType.ROAD,
        }),
      }),
    );

    return lambdaSecurityGroup;
  }

  private createVpc(): Vpc {
    return new Vpc(this, "OsKeyFiguresVPC", {
      natGateways: 1,
      maxAzs: 2,
    });
  }
}
