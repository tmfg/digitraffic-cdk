import { Duration, type Environment, Stack } from "aws-cdk-lib";
import {
  type ISecurityGroup,
  type IVpc,
  Peer,
  Port,
  SecurityGroup,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { TriggerFunction } from "aws-cdk-lib/triggers";
import type { Construct } from "constructs";
import type { OSMonitor } from "./monitor/monitor.js";
import { writeFileSync } from "node:fs";
import { EnvKeys } from "./env.js";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export interface OSMonitorsConfiguration {
  /** account */
  readonly env: Environment;
  /** vpc for the lambda(and vpc endpoint) */
  readonly vpcId: string;
  /** external role that lambda assumes that is authorized to write to opensearch */
  readonly osRoleArn: string;

  /** OpenSearch hostname */
  readonly osHost: string;
  /** OpenSearch VPC Endpoint */
  readonly osVpcEndpoint: string;

  /** create lambda or not */
  readonly createLambda: boolean;
  /** OpenSearch monitors that lambda should create */
  readonly monitors: OSMonitor[];
  readonly secretId: string;
}

/**
 * A stack to create lambda that runs once when deployed and removes all
 * monitors from configured OpenSearch and then recreates them according to configuration.
 *
 * Because you can't create OpenSearch VPC Endpoint with cdk(yet), you have to enroll this in two stages.
 *
 * When deploying for the first time, deploy with createLambda = false.  Then manually create
 * the OpenSearch VPC Endpoint in same vpc and private subnets as this stack and AccessOpenSearchSG security group created by this stack
 * and then configure endpoint address to osVpcEndpoint and deploy again with createLambda = true
 */
export class UpdateOSMonitorsStack extends Stack {
  constructor(scope: Construct, id: string, config: OSMonitorsConfiguration) {
    super(scope, id, { env: config.env });

    const vpc = Vpc.fromLookup(this, "LambdaVPC", {
      vpcId: config.vpcId,
    });

    const lambdaSg = this.createSecurityGroups(vpc);

    if (config.createLambda) {
      writeFileSync(
        "./dist/lambda/monitors.json",
        JSON.stringify(config.monitors, null, 2),
      );

      // Just for local diffing
      const timestamp = new Date().toISOString()
        .replace(/\.\d{3}Z$/, "Z") // drop milliseconds
        .replace(/[:]/g, "-"); // replace ":" with "-"
      writeFileSync(
        `./cdk.out/${timestamp}-monitors.json`,
        JSON.stringify(config.monitors, null, 2),
      );

      const lambda = this.createLambda(
        vpc,
        lambdaSg,
        config.osHost,
        config.osVpcEndpoint,
        config.osRoleArn,
        config.secretId,
      );

      const secret = Secret.fromSecretNameV2(
        this,
        "Secret",
        config.secretId,
      );
      secret.grantRead(lambda);
    }
  }

  /**
   * Creates two security groups, one for the lambda
   * and one for the OpenSearch VPC Endpoint(which you must make manually)
   *
   * returns the lambda sg
   */
  createSecurityGroups(vpc: IVpc): ISecurityGroup {
    const lambdaSg = new SecurityGroup(this, "UpdateOSMonitorsSG", {
      vpc,
    });

    const osSg = new SecurityGroup(this, "AccessOpenSearchSG", {
      vpc,
    });

    osSg.addIngressRule(
      Peer.securityGroupId(lambdaSg.securityGroupId),
      Port.allTraffic(),
      "Traffic from update lambda",
    );

    return lambdaSg;
  }

  createLambda(
    vpc: IVpc,
    sg: ISecurityGroup,
    osHost: string,
    osVpcEndpoint: string,
    roleArn: string,
    secretId: string,
  ): TriggerFunction {
    const triggerFunction = new TriggerFunction(this, "UpdateOSMonitors", {
      vpc: vpc,
      securityGroups: [sg],
      timeout: Duration.seconds(30),
      functionName: "UpdateOSMonitors",
      runtime: Runtime.NODEJS_22_X,
      handler: "update-os-monitors.handler",
      code: new AssetCode("dist/lambda"),
      environment: {
        [EnvKeys.ROLE]: roleArn,
        [EnvKeys.OS_HOST]: osHost,
        [EnvKeys.OS_VPC_ENDPOINT]: osVpcEndpoint,
        [EnvKeys.SECRET_ID]: secretId,
      },
    });

    triggerFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["sts:AssumeRole"],
        resources: [roleArn],
      }),
    );
    return triggerFunction;
  }
}
