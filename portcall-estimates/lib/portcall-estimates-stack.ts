import {Construct, Duration, Stack, StackProps} from '@aws-cdk/core';
import {SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import * as Sqs from './sqs';
import {Props} from './app-props'
import {Bucket} from "@aws-cdk/aws-s3";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {Subscription, SubscriptionProtocol, Topic} from "@aws-cdk/aws-sns";
import {Queue} from "@aws-cdk/aws-sqs";

export class PortcallEstimatesStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        const queueAndDLQ = Sqs.createQueue(this);
        const dlqBucket = new Bucket(this, 'DLQBucket', {
            bucketName: appProps.dlqBucketName
        });
        InternalLambdas.create(queueAndDLQ, dlqBucket, vpc, lambdaDbSg, appProps, this);
        IntegrationApi.create(queueAndDLQ.queue, vpc, lambdaDbSg, appProps, this);
        PublicApi.create(vpc, lambdaDbSg, appProps, this);
        this.addDLQAlarm(queueAndDLQ.dlq, appProps);
    }

    addDLQAlarm(queue: Queue, appProps: Props) {
        const alarmName = 'PortcallEstimatesDLQAlarm';
        queue.metricNumberOfMessagesReceived({
            period: appProps.dlqNotificationDuration
        }).createAlarm(this, alarmName, {
            alarmName,
            threshold: 0,
            evaluationPeriods: 1
        }).addAlarmAction(new SnsAction(Topic.fromTopicArn(this, 'Topic', appProps.dlqNotificationTopicArn)));
    }
}
