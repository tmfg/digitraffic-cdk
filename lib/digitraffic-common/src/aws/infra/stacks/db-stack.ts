import {
  type InstanceType,
  type ISecurityGroup,
  type IVpc,
  SecurityGroup,
  SubnetType,
} from "aws-cdk-lib/aws-ec2";
import {
  type AuroraPostgresEngineVersion,
  CfnDBInstance,
  ClusterInstance,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseClusterFromSnapshot,
  type DatabaseClusterProps,
  InstanceUpdateBehaviour,
  type IParameterGroup,
  ParameterGroup,
} from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib/core";
import type { Construct } from "constructs/lib/construct.js";
import { exportValue, importVpc } from "../import-util.js";
import { createParameter } from "../stack/parameters.js";
import type { InfraStackConfiguration } from "./intra-stack-configuration.js";

export interface DbConfiguration {
  readonly cluster?: ClusterConfiguration;
  readonly clusterImport?: ClusterImportConfiguration;

  readonly customParameterGroups: AuroraPostgresEngineVersion[];
  readonly workmem?: number; // default 524288, 512MiB

  /** superuser username and password are fetched from this secret, using keys
   * db.superuser and db.superuser.password
   */
  readonly secretArn: string;

  /** If this is not specified, import default vpc */
  readonly vpc?: IVpc;
}

export interface ClusterDbInstanceConfiguration {
  readonly instanceType: InstanceType;
  readonly isFromLegacyInstanceProps?: boolean; // default false
}

export interface ClusterConfiguration {
  readonly securityGroupId: string;
  readonly snapshotIdentifier?: string;
  readonly dbVersion: AuroraPostgresEngineVersion;

  readonly writer: ClusterDbInstanceConfiguration;
  readonly readers: ClusterDbInstanceConfiguration[];
}

export interface ClusterImportConfiguration {
  readonly clusterReadEndpoint: string;
  readonly clusterWriteEndpoint: string;
  /** Override clusterIdentifier if clusterWriteEndpoint name doesn't contain
   * clusterIdentifier before '.cluster' substring.
   * clusterWriteEndpoint name that is normally formed stackenv-stackenvxxx-xxx.cluster-xxx.region.rds.amazonaws.com
   * and we can parse clusterIdentifier from it. */
  readonly clusterIdentifier?: string;
}

/**
 * Stack that creates DatabaseCluster.
 *
 * Please not, that created Cluster has RETAIL removalPolicy, so if you want to delete the stack,
 * you must first deploy without parameter group, then delete stack and manually delete cluster.
 *
 * You should deploy once with cluster and then without.  This way you can create the cluster with this
 * stack, but cluster is not part of the stack after that.
 */

export class DbStack extends Stack {
  public static CLUSTER_PORT: number = 5432;

  public static CLUSTER_IDENTIFIER_EXPORT_NAME: string = "db-cluster";
  public static CLUSTER_READ_ENDPOINT_EXPORT_NAME: string =
    "db-cluster-reader-endpoint";
  public static CLUSTER_WRITE_ENDPOINT_EXPORT_NAME: string =
    "db-cluster-writer-endpoint";

  public clusterIdentifier: string = "";

  constructor(
    scope: Construct,
    id: string,
    isc: InfraStackConfiguration,
    configuration: DbConfiguration,
  ) {
    super(scope, id, {
      env: isc.env,
    });

    const parameterGroups = this.createParameterGroups(
      configuration.customParameterGroups,
      configuration.workmem ?? 524288,
    );

    if (
      (configuration.cluster && configuration.clusterImport) ||
      (!configuration.cluster && !configuration.clusterImport)
    ) {
      throw new Error("Configure either cluster or clusterImport");
    }

    // create cluster if this is wanted, should do it only once
    if (configuration.cluster) {
      const cluster = this.createAuroraCluster(
        isc,
        configuration,
        configuration.cluster,
        parameterGroups,
      );

      exportValue(
        this,
        isc.environmentName,
        DbStack.CLUSTER_IDENTIFIER_EXPORT_NAME,
        cluster.clusterIdentifier,
      );

      exportValue(
        this,
        isc.environmentName,
        DbStack.CLUSTER_WRITE_ENDPOINT_EXPORT_NAME,
        cluster.clusterEndpoint.hostname,
      );

      exportValue(
        this,
        isc.environmentName,
        DbStack.CLUSTER_READ_ENDPOINT_EXPORT_NAME,
        cluster.clusterReadEndpoint.hostname,
      );

      createParameter(
        this,
        "cluster.reader",
        cluster.clusterReadEndpoint.hostname,
      );
      createParameter(this, "cluster.writer", cluster.clusterEndpoint.hostname);
      createParameter(this, "cluster.identifier", cluster.clusterIdentifier);

      this.clusterIdentifier = cluster.clusterIdentifier;
    }

    if (configuration.clusterImport) {
      createParameter(
        this,
        "cluster.reader",
        configuration.clusterImport.clusterReadEndpoint,
      );
      createParameter(
        this,
        "cluster.writer",
        configuration.clusterImport.clusterWriteEndpoint,
      );

      // If clusterIdentifier is provided we use it and otherwise we try to parse it from
      // from clusterWriteEndpoint name that is normally formed stackenv-stackenvxxx-xxx.cluster-xxx.region.rds.amazonaws.com
      // and part before .cluster is clusterIdentifier.
      if (configuration.clusterImport.clusterIdentifier) {
        this.clusterIdentifier = configuration.clusterImport.clusterIdentifier;
      } else if (
        configuration.clusterImport.clusterWriteEndpoint !== undefined &&
        configuration.clusterImport.clusterWriteEndpoint.split(
            ".cluster",
          )[0] !== undefined &&
        configuration.clusterImport.clusterWriteEndpoint.split(
            ".cluster",
          )[0] !== configuration.clusterImport.clusterWriteEndpoint
      ) {
        // @ts-ignore We check that this is defined
        this.clusterIdentifier =
          configuration.clusterImport.clusterWriteEndpoint.split(".cluster")[0];
      } else {
        throw new Error(
          "Could not resolve 'clusterIdentifier' from 'configuration.clusterImport': " +
            configuration.clusterImport.clusterWriteEndpoint +
            " Either 'configuration.clusterImport.clusterReadEndpoint' didn't contain '.cluster' or " +
            "configuration.clusterImport.clusterIdentifier was not defined to override default value.",
        );
      }
    }
  }

  createParameterGroups(
    customVersions: AuroraPostgresEngineVersion[],
    workmem: number,
  ): IParameterGroup[] {
    return customVersions.map((version: AuroraPostgresEngineVersion) => {
      const pg = new ParameterGroup(
        this,
        `parameter-group-${version.auroraPostgresMajorVersion}`,
        {
          engine: DatabaseClusterEngine.auroraPostgres({
            version,
          }),
          parameters: {
            "pg_stat_statements.track": "ALL",
            random_page_cost: "1",
            work_mem: workmem.toString(),
          },
        },
      );

      // create both cluster parameter group and instance parameter group
      pg.bindToCluster({});
      pg.bindToInstance({});

      return pg;
    });
  }

  createClusterParameters(
    secretArn: string,
    clusterConfiguration: ClusterConfiguration,
    instanceName: string,
    vpc: IVpc,
    securityGroup: ISecurityGroup,
    parameterGroup: IParameterGroup,
  ): DatabaseClusterProps {
    const secret = Secret.fromSecretCompleteArn(this, "DBSecret", secretArn);

    const defaultDbInstanceProps = {
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,
      enablePerformanceInsights: true,
      parameterGroup: parameterGroup,
    };

    const writer = ClusterInstance.provisioned("WriterInstance", {
      ...{
        instanceType: clusterConfiguration.writer.instanceType,
        isFromLegacyInstanceProps:
          clusterConfiguration.writer.isFromLegacyInstanceProps,
      },
      ...defaultDbInstanceProps,
    });

    const readers = clusterConfiguration.readers.map((reader, index) =>
      ClusterInstance.provisioned(`ReaderInstance${index}`, {
        ...{
          instanceType: reader.instanceType,
          isFromLegacyInstanceProps: reader.isFromLegacyInstanceProps,
        },
        ...defaultDbInstanceProps,
      })
    );

    return {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: clusterConfiguration.dbVersion,
      }),
      writer,
      readers,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [securityGroup],
      vpc,
      instanceUpdateBehaviour: InstanceUpdateBehaviour.ROLLING,
      instanceIdentifierBase: instanceName + "-",
      cloudwatchLogsExports: ["postgresql"],
      backup: {
        retention: Duration.days(35),
        preferredWindow: "01:00-02:00",
      },
      preferredMaintenanceWindow: "mon:03:00-mon:04:00",
      deletionProtection: true,
      removalPolicy: RemovalPolicy.RETAIN,
      port: DbStack.CLUSTER_PORT,
      credentials: Credentials.fromPassword(
        secret.secretValueFromJson("db.superuser").unsafeUnwrap(),
        secret.secretValueFromJson("db.superuser.password"),
      ),
      parameterGroup,
      monitoringInterval: Duration.seconds(30),
    };
  }

  createAuroraCluster(
    isc: InfraStackConfiguration,
    configuration: DbConfiguration,
    clusterConfiguration: ClusterConfiguration,
    parameterGroups: IParameterGroup[],
  ): DatabaseCluster {
    const instanceName = isc.environmentName + "-db";
    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      "securitygroup",
      clusterConfiguration.securityGroupId,
    );
    const vpc = configuration.vpc
      ? configuration.vpc
      : importVpc(this, isc.environmentName);

    if (parameterGroups[0] === undefined) {
      throw Error("ParameterGroups should not be empty");
    }

    const parameters = this.createClusterParameters(
      configuration.secretArn,
      clusterConfiguration,
      instanceName,
      vpc,
      securityGroup,
      parameterGroups[0],
    );

    // create cluster from the snapshot or from the scratch
    const cluster = clusterConfiguration.snapshotIdentifier
      ? new DatabaseClusterFromSnapshot(this, instanceName, {
        ...parameters,
        ...{
          snapshotIdentifier: clusterConfiguration.snapshotIdentifier,
        },
      })
      : new DatabaseCluster(this, instanceName, parameters);

    // this workaround should prevent stack failing on version upgrade
    // https://github.com/aws/aws-cdk/issues/21758
    // https://github.com/aws/aws-cdk/pull/22185
    // Maybe this could be removed completely as we don't update db with the CDK?
    const cfnInstances = cluster.node.children.filter(
      (child): child is CfnDBInstance => child instanceof CfnDBInstance,
    );
    // if (cfnInstances.length === 0) {
    //     throw new Error("Couldn't pull CfnDBInstances from the L1 constructs!");
    // }
    cfnInstances.forEach((cfnInstance) => delete cfnInstance.engineVersion);

    return cluster;
  }
}
