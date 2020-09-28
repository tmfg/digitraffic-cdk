import {Construct, Duration, Stack, StackProps} from '@aws-cdk/core';
import {SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
import {Props} from './app-props-subscriptions';
import * as PublicApi from './public-api';
import {AssetCode, Function, Runtime} from '@aws-cdk/aws-lambda';
import {PolicyStatement} from '@aws-cdk/aws-iam';
import {Topic} from '@aws-cdk/aws-sns';
import {SnsEventSource} from '@aws-cdk/aws-lambda-event-sources';
import {createSubscription} from '../../../../common/stack/subscription';
import {RetentionDays} from '@aws-cdk/aws-logs';
import {Rule, Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {AttributeType, Table} from '@aws-cdk/aws-dynamodb';
import {SUBSCRIPTIONS_TABLE_NAME} from './service/subscriptions';

export class PortcallEstimateSubscriptionsStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        const topicName = 'PortcallEstimateSubscriptions-IncomingSMS';
        const incomingSmsTopic = new Topic(this, topicName, {
            topicName
        });

        const sendShiplistLambda = this.createSendShiplistLambda(appProps);
        const schedulingCloudWatchRule = this.createSchedulingCloudWatchRule();
        schedulingCloudWatchRule.addTarget(new LambdaFunction(sendShiplistLambda));

        this.createSmsHandlerLambda(incomingSmsTopic, appProps);
        
        const subscriptionTable = this.createSubscriptionTable();
        
        PublicApi.create(vpc,
            lambdaDbSg,
            subscriptionTable,
            appProps,
            this);

    }

    private createSubscriptionTable(): any {
        return new Table(this, 'subscription-table', {
            partitionKey: { name: 'ID', type: AttributeType.STRING},
            sortKey: {name: 'Time', type: AttributeType.STRING},
            tableName: SUBSCRIPTIONS_TABLE_NAME,
            readCapacity: 1,
            writeCapacity: 1
        });
    }

    private createSendShiplistLambda(props: Props): Function {
        const functionName = 'PortcallEstimateSubscriptions-SendShiplist';
        const sendShiplistLambda = new Function(this, functionName, {
            functionName,
            code: new AssetCode('dist/subscriptions/lambda/send-shiplist'),
            handler: 'lambda-send-shiplist.handler',
            runtime: Runtime.NODEJS_12_X,
            memorySize: 1024,
            timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
            logRetention: RetentionDays.ONE_YEAR,
        });
        createSubscription(sendShiplistLambda, functionName, props.logsDestinationArn, this);
        return sendShiplistLambda;
    }

    private createSchedulingCloudWatchRule(): Rule {
        const ruleName = 'PortcallEstimateSubscriptions-Scheduler'
        return new Rule(this, ruleName, {
            ruleName,
            schedule: Schedule.expression('cron(0 * * * ? *)') // every minute
        });
    }

    private static createWriteToPolicy(pinpointApplicationId: string) {
        return new PolicyStatement({
            actions: [
                'mobiletargeting:*'
            ],
            resources: [
                `arn:aws:mobiletargeting:*:*:apps/${pinpointApplicationId}`,
                `arn:aws:mobiletargeting:*:*:apps/${pinpointApplicationId}/*`
            ]
        });
    }

    private createSmsHandlerLambda(
        incomingSmsTopic: Topic,
        props: Props) {
        const functionName = 'PortcallEstimateSubscriptions-HandleSMS';
        const smsHandlerLambda = new Function(this, functionName, {
            functionName,
            code: new AssetCode('dist/subscriptions/lambda/handle-sms'),
            handler: 'lambda-handle-sms.handler',
            runtime: Runtime.NODEJS_12_X,
            memorySize: 1024,
            timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
            logRetention: RetentionDays.ONE_YEAR,
            environment: {
                PINPOINT_ID: props.pinpointApplicationId,
                PINPOINT_NUMBER: props.pinpointTelephoneNumber
            }
        });
        smsHandlerLambda.addEventSource(new SnsEventSource(incomingSmsTopic));
        smsHandlerLambda.addToRolePolicy(
            PortcallEstimateSubscriptionsStack.createWriteToPolicy(props.pinpointApplicationId));
        createSubscription(smsHandlerLambda, functionName, props.logsDestinationArn, this);
    }
}
