import { InstanceType, type ISecurityGroup, type IVpc, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import {
    AuroraPostgresEngineVersion,
    CfnDBInstance,
    Credentials,
    DatabaseCluster,
    DatabaseClusterEngine,
    DatabaseClusterFromSnapshot,
    type DatabaseClusterProps,
    InstanceUpdateBehaviour,
    type IParameterGroup,
    ParameterGroup,
} from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs/lib/construct.js";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import type { InfraStackConfiguration } from "./intra-stack-configuration.js";
import { exportValue, importVpc } from "../import-util.js";
import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib/core";
import { createParameter } from "../stack/parameters.js";

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

export interface ClusterConfiguration {
    readonly securityGroupId: string;
    readonly dbInstanceType: InstanceType;
    readonly snapshotIdentifier?: string;
    readonly instances: number;
    readonly dbVersion: AuroraPostgresEngineVersion;
    readonly storageEncrypted?: boolean; /// default true
}

export interface ClusterImportConfiguration {
    readonly clusterReadEndpoint: string;
    readonly clusterWriteEndpoint: string;
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
    public static CLUSTER_PORT = 5432;

    public static CLUSTER_IDENTIFIER_EXPORT_NAME = "db-cluster";
    public static CLUSTER_READ_ENDPOINT_EXPORT_NAME = "db-cluster-reader-endpoint";
    public static CLUSTER_WRITE_ENDPOINT_EXPORT_NAME = "db-cluster-writer-endpoint";

    public clusterIdentifier = "";

    constructor(scope: Construct, id: string, isc: InfraStackConfiguration, configuration: DbConfiguration) {
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

            createParameter(this, "cluster.reader", cluster.clusterReadEndpoint.hostname);
            createParameter(this, "cluster.writer", cluster.clusterEndpoint.hostname);
            createParameter(this, "cluster.identifier", cluster.clusterIdentifier);

            this.clusterIdentifier = cluster.clusterIdentifier;
        }

        if (configuration.clusterImport) {
            createParameter(this, "cluster.reader", configuration.clusterImport.clusterReadEndpoint);
            createParameter(this, "cluster.writer", configuration.clusterImport.clusterWriteEndpoint);
        }
    }

    createParameterGroups(customVersions: AuroraPostgresEngineVersion[], workmem: number): IParameterGroup[] {
        return customVersions.map((version: AuroraPostgresEngineVersion) => {
            const pg = new ParameterGroup(this, `parameter-group-${version.auroraPostgresMajorVersion}`, {
                engine: DatabaseClusterEngine.auroraPostgres({
                    version,
                }),
                parameters: {
                    "pg_stat_statements.track": "ALL",
                    random_page_cost: "1",
                    work_mem: workmem.toString(),
                },
            });

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

        return {
            engine: DatabaseClusterEngine.auroraPostgres({
                version: clusterConfiguration.dbVersion,
            }),
            instances: clusterConfiguration.instances,
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
            instanceProps: {
                autoMinorVersionUpgrade: true,
                allowMajorVersionUpgrade: false,
                enablePerformanceInsights: true,
                vpc,
                securityGroups: [securityGroup],
                vpcSubnets: {
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                },
                instanceType: clusterConfiguration.dbInstanceType,
                parameterGroup,
            },
            credentials: Credentials.fromPassword(
                secret.secretValueFromJson("db.superuser").unsafeUnwrap(),
                secret.secretValueFromJson("db.superuser.password"),
            ),
            parameterGroup,
            //            storageEncrypted: clusterConfiguration.storageEncrypted ?? true,
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
        const vpc = configuration.vpc ? configuration.vpc : importVpc(this, isc.environmentName);

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
        const cfnInstances = cluster.node.children.filter(
            (child): child is CfnDBInstance => child instanceof CfnDBInstance,
        );
        if (cfnInstances.length === 0) {
            throw new Error("Couldn't pull CfnDBInstances from the L1 constructs!");
        }
        cfnInstances.forEach((cfnInstance) => delete cfnInstance.engineVersion);

        return cluster;
    }
}
