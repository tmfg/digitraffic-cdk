import {Construct, Duration, Stack, StackProps} from '@aws-cdk/core';
import {ISecurityGroup, IVpc, SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
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
import {
    SUBSCRIPTION_LOCODE_ATTRIBUTE,
    SUBSCRIPTION_PHONENUMBER_ATTRIBUTE,
    SUBSCRIPTIONS_LOCODE_IDX_NAME,
    SUBSCRIPTIONS_TABLE_NAME,
    SUBSCRIPTIONS_TIME_IDX_NAME
} from "./db/db-subscriptions";
import {INFO_ID_ATTRIBUTE, INFO_TABLE_NAME} from "./db/db-info";

export class PortcallEstimateSubscriptionsStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });

        const incomingSmsTopic = this.createSmsTopic();

        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);
        const sendShiplistLambda = this.createSendShiplistLambda(vpc, lambdaDbSg, appProps);
        const smsHandlerLambda = this.createSmsHandlerLambda(incomingSmsTopic, appProps);
        const estimationHandlerLambda = this.createEstimationHandlerLambda(vpc, lambdaDbSg, appProps)

        // grant publish to topic to lambda
        const smsTopic = Topic.fromTopicArn(this, "SmsSendingTopic", appProps.shiplistSnsTopicArn);
        smsTopic.grantPublish(sendShiplistLambda);
        smsTopic.grantPublish(estimationHandlerLambda);

        const subscriptionTable = this.createSubscriptionTable();
        subscriptionTable.grantReadWriteData(smsHandlerLambda);
        subscriptionTable.grantReadWriteData(sendShiplistLambda);
        subscriptionTable.grantReadWriteData(estimationHandlerLambda);

        const subscriptionInfoTable = this.createSubscriptionInfoTable();
        subscriptionInfoTable.grantReadWriteData(smsHandlerLambda);
        subscriptionInfoTable.grantReadWriteData(sendShiplistLambda);
        subscriptionInfoTable.grantReadWriteData(estimationHandlerLambda);

        PublicApi.create(
            subscriptionInfoTable,
            appProps,
            this);
    }

    private createSmsTopic(): any {
        const topicName = 'PortcallEstimateSubscriptions-IncomingSMS';
        return new Topic(this, topicName, {
            topicName
        });
    }

    private createSubscriptionTable() {
        const table = new Table(this, 'subscription-table', {
            partitionKey: { name: SUBSCRIPTION_PHONENUMBER_ATTRIBUTE, type: AttributeType.STRING},
            sortKey: { name: SUBSCRIPTION_LOCODE_ATTRIBUTE, type: AttributeType.STRING },
            tableName: SUBSCRIPTIONS_TABLE_NAME,
            readCapacity: 1,
            writeCapacity: 1
        });
        table.addGlobalSecondaryIndex({
            indexName: SUBSCRIPTIONS_TIME_IDX_NAME,
            partitionKey: { name: 'Time', type: AttributeType.STRING }
        });
        table.addGlobalSecondaryIndex({
            indexName: SUBSCRIPTIONS_LOCODE_IDX_NAME,
            partitionKey: { name: 'Locode', type: AttributeType.STRING }
        });
        return table;
    }

    private createSubscriptionInfoTable() {
        return new Table(this, 'info-table', {
            partitionKey: { name: INFO_ID_ATTRIBUTE, type: AttributeType.STRING},
            tableName: INFO_TABLE_NAME,
            readCapacity: 1,
            writeCapacity: 1
        });
    }

    private createSendShiplistLambda(vpc: IVpc, lambdaDbSg: ISecurityGroup, props: Props): Function {
        const functionName = 'PortcallEstimateSubscriptions-SendShiplist';
        const sendShiplistLambda = new Function(this, functionName, {
            functionName,
            code: new AssetCode('dist/subscriptions/lambda/send-shiplist'),
            handler: 'lambda-send-shiplist.handler',
            runtime: Runtime.NODEJS_12_X,
            memorySize: 256,
            timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
            logRetention: RetentionDays.ONE_YEAR,
            vpc: vpc,
            vpcSubnets: {
                subnets: vpc.privateSubnets
            },
            securityGroup: lambdaDbSg,
            environment: {
                SHIPLIST_SNS_TOPIC_ARN: props.shiplistSnsTopicArn,
                PINPOINT_ID: props.pinpointApplicationId,
                PINPOINT_NUMBER: props.pinpointTelephoneNumber,
                DB_USER: props.dbProps.username,
                DB_PASS: props.dbProps.password,
                DB_URI: props.dbProps.ro_uri,
                SHIPLIST_URL: props.shiplistUrl
            }
        });
        sendShiplistLambda.addToRolePolicy(
            PortcallEstimateSubscriptionsStack.createWriteToPinpointPolicy(props.pinpointApplicationId));
        createSubscription(sendShiplistLambda, functionName, props.logsDestinationArn, this);

        const schedulingCloudWatchRule = this.createSchedulingCloudWatchRule();
        schedulingCloudWatchRule.addTarget(new LambdaFunction(sendShiplistLambda));

        return sendShiplistLambda;
    }

    private createSchedulingCloudWatchRule(): Rule {
        const ruleName = 'PortcallEstimateSubscriptions-Scheduler'
        return new Rule(this, ruleName, {
            ruleName,
            schedule: Schedule.expression('cron(* * * * ? *)') // every minute
        });
    }

    private static createWriteToPinpointPolicy(pinpointApplicationId: string) {
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
        props: Props): Function {
        const functionName = 'PortcallEstimateSubscriptions-HandleSMS';
        const smsHandlerLambda = new Function(this, functionName, {
            functionName,
            code: new AssetCode('dist/subscriptions/lambda/handle-sms'),
            handler: 'lambda-handle-sms.handler',
            runtime: Runtime.NODEJS_12_X,
            memorySize: 256,
            timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
            logRetention: RetentionDays.ONE_YEAR,
            environment: {
                PINPOINT_ID: props.pinpointApplicationId,
                PINPOINT_NUMBER: props.pinpointTelephoneNumber
            }
        });
        smsHandlerLambda.addEventSource(new SnsEventSource(incomingSmsTopic));
        smsHandlerLambda.addToRolePolicy(
            PortcallEstimateSubscriptionsStack.createWriteToPinpointPolicy(props.pinpointApplicationId));
        createSubscription(smsHandlerLambda, functionName, props.logsDestinationArn, this);

        return smsHandlerLambda;
    }

    private createEstimationHandlerLambda(vpc: IVpc, lambdaDbSg: ISecurityGroup, props: Props): Function {
        const functionName = 'PortcallEstimatesUpdated';
        const estimateHandlerLambda = new Function(this, functionName, {
            functionName,
            code: new AssetCode('dist/subscriptions/lambda/handle-estimate'),
            handler: 'lambda-handle-estimate.handler',
            runtime: Runtime.NODEJS_12_X,
            memorySize: 256,
            timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
            logRetention: RetentionDays.ONE_YEAR,
            vpc: vpc,
            vpcSubnets: {
                subnets: vpc.privateSubnets
            },
            securityGroup: lambdaDbSg,
            environment: {
                DB_USER: props.dbProps.username,
                DB_PASS: props.dbProps.password,
                DB_URI: props.dbProps.ro_uri,
                PINPOINT_ID: props.pinpointApplicationId,
                PINPOINT_NUMBER: props.pinpointTelephoneNumber
            }
        });
        estimateHandlerLambda.addEventSource(new SnsEventSource(Topic.fromTopicArn(this, "EstimateTopic", props.estimateUpdatedTopicArn)));
        estimateHandlerLambda.addToRolePolicy(
            PortcallEstimateSubscriptionsStack.createWriteToPinpointPolicy(props.pinpointApplicationId));
        createSubscription(estimateHandlerLambda, functionName, props.logsDestinationArn, this);

        return estimateHandlerLambda;
    }
}
