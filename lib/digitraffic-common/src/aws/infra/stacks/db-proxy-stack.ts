import {
  CfnDBProxyEndpoint,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseProxy,
  ProxyTarget,
} from "aws-cdk-lib/aws-rds";
import { type ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { type IVpc, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import type { InfraStackConfiguration } from "./intra-stack-configuration.js";
import { DbStack } from "./db-stack.js";
import { exportValue, importVpc } from "../import-util.js";
import { createParameter } from "../stack/parameters.js";
import { Duration, Stack } from "aws-cdk-lib/core";
import type { Construct } from "constructs/lib/construct.js";

export interface ProxyConfiguration {
  readonly secretArn: string;
  readonly name?: string;
  readonly securityGroupId: string;
  readonly clusterIdentifier: string;
}

/**
 * A stack that creates a Database proxy.
 */
export class DbProxyStack extends Stack {
  readonly isc: InfraStackConfiguration;

  public static PROXY_READER_EXPORT_NAME: string = "db-reader-endpoint";
  public static PROXY_WRITER_EXPORT_NAME: string = "db-writer-endpoint";

  constructor(
    scope: Construct,
    id: string,
    isc: InfraStackConfiguration,
    configuration: ProxyConfiguration,
  ) {
    super(scope, id, {
      env: isc.env,
    });

    this.isc = isc;

    if (configuration.clusterIdentifier === "") {
      throw new Error("Empty cluster identifier!");
    }

    const vpc = importVpc(this, isc.environmentName);
    const secret = Secret.fromSecretAttributes(this, "proxy-secret", {
      secretCompleteArn: configuration.secretArn,
    });

    const proxy = this.createProxy(vpc, secret, configuration);
    const readerEndpoint = this.createProxyEndpoints(
      vpc,
      proxy,
      configuration.securityGroupId,
    );

    createParameter(this, "proxy.reader", readerEndpoint.attrEndpoint);
    createParameter(this, "proxy.writer", proxy.endpoint);

    this.setOutputs(proxy);
  }

  setOutputs(proxy: DatabaseProxy): void {
    // if only one instance, then there is no reader-endpoint
    exportValue(
      this,
      this.isc.environmentName,
      DbProxyStack.PROXY_READER_EXPORT_NAME,
      proxy.endpoint,
    );
    exportValue(
      this,
      this.isc.environmentName,
      DbProxyStack.PROXY_WRITER_EXPORT_NAME,
      proxy.endpoint,
    );
  }

  createProxy(
    vpc: IVpc,
    secret: ISecret,
    configuration: ProxyConfiguration,
  ): DatabaseProxy {
    const proxyId = `${this.isc.environmentName}-proxy`;
    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      "securitygroup",
      configuration.securityGroupId,
    );

    const cluster = DatabaseCluster.fromDatabaseClusterAttributes(
      this,
      "db-cluster",
      {
        clusterIdentifier: configuration.clusterIdentifier,
        engine: DatabaseClusterEngine.AURORA_POSTGRESQL,
        port: DbStack.CLUSTER_PORT,
      },
    );

    // CDK tries to allow connections between proxy and cluster
    // this does not work on cluster references
    cluster.connections.allowDefaultPortFrom = () => {
      /* nothing */
    };

    return new DatabaseProxy(this, proxyId, {
      dbProxyName: configuration.name ?? "AuroraProxy",
      securityGroups: [securityGroup],
      proxyTarget: ProxyTarget.fromCluster(cluster),
      idleClientTimeout: Duration.seconds(1800),
      maxConnectionsPercent: 50,
      maxIdleConnectionsPercent: 25,
      borrowTimeout: Duration.seconds(120),
      requireTLS: false,
      secrets: [secret],
      vpc: vpc,
    });
  }

  createProxyEndpoints(
    vpc: IVpc,
    proxy: DatabaseProxy,
    securityGroupId: string,
  ): CfnDBProxyEndpoint {
    return new CfnDBProxyEndpoint(this, "ReaderEndpoint", {
      dbProxyEndpointName: "ReaderEndpoint",
      dbProxyName: proxy.dbProxyName,
      vpcSubnetIds: vpc.privateSubnets.map((sub) => sub.subnetId),
      vpcSecurityGroupIds: [securityGroupId],
      targetRole: "READ_ONLY",
    });
  }
}
