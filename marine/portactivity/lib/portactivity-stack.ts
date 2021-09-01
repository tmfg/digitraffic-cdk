import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {ISecurityGroup, IVpc, SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import * as Canaries from './canaries';
import * as Sqs from './sqs';
import {Props} from './app-props';
import {Bucket} from "@aws-cdk/aws-s3";
import {
    DatabaseCluster,
    DatabaseClusterEngine,
    DatabaseProxy,
    ProxyTarget
} from "@aws-cdk/aws-rds";
import {ISecret, Secret} from "@aws-cdk/aws-secretsmanager";

export class PortActivityStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const secret = Secret.fromSecretNameV2(this, 'PortActivitySecret', appProps.secretId);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        this.createRdsProxy(secret, lambdaDbSg, vpc, appProps);

        const queueAndDLQ = Sqs.createQueue(this);
        const dlqBucket = new Bucket(this, 'DLQBucket', {
            bucketName: appProps.dlqBucketName
        });

        InternalLambdas.create(queueAndDLQ, dlqBucket, secret, vpc, lambdaDbSg, appProps, this);
        IntegrationApi.create(queueAndDLQ.queue, vpc, lambdaDbSg, appProps, this);
        PublicApi.create(secret, vpc, lambdaDbSg, appProps, this);
        Canaries.create(this, queueAndDLQ.dlq, appProps);

        new Bucket(this, 'DocumentationBucket', {
            bucketName: appProps.documentationBucketName
        });
    }

    createRdsProxy(
        secret: ISecret,
        sg: ISecurityGroup,
        vpc: IVpc,
        appProps: Props) {
        const cluster = DatabaseCluster.fromDatabaseClusterAttributes(this, 'DbCluster', {
            clusterIdentifier: appProps.dbClusterIdentifier,
            engine: DatabaseClusterEngine.AURORA_POSTGRESQL
        });

        // CDK tries to allow connections between proxy and cluster
        // this does not work on cluster references
        // @ts-ignore
        cluster.connections.allowDefaultPortFrom = () => {};

        const dbProxyName = 'PortActivityRDSProxy';
        new DatabaseProxy(this, dbProxyName, {
            dbProxyName,
            vpc,
            secrets: [secret],
            proxyTarget: ProxyTarget.fromCluster(cluster),
            securityGroups: [sg],
            requireTLS: false
        });
    }

}
