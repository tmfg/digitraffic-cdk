import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {ISecurityGroup, IVpc, SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import * as Sqs from './sqs';
import {Props} from './app-props';
import {Bucket} from "@aws-cdk/aws-s3";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {Topic} from "@aws-cdk/aws-sns";
import {Queue} from "@aws-cdk/aws-sqs";
import {ComparisonOperator, TreatMissingData} from "@aws-cdk/aws-cloudwatch";
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

        this.addDLQAlarm(queueAndDLQ.dlq, appProps);
    }

    addDLQAlarm(queue: Queue, appProps: Props) {
        const alarmName = 'PortActivity-TimestampsDLQAlarm';
        queue.metricNumberOfMessagesReceived({
            period: appProps.dlqNotificationDuration
        }).createAlarm(this, alarmName, {
            alarmName,
            threshold: 0,
            evaluationPeriods: 1,
            treatMissingData: TreatMissingData.NOT_BREACHING,
            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD
        }).addAlarmAction(new SnsAction(Topic.fromTopicArn(this, 'Topic', appProps.dlqNotificationTopicArn)));
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
