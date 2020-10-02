import {Construct, Duration, Stack, StackProps} from '@aws-cdk/core';
import {SecurityGroup, ISecurityGroup, Vpc, IVpc} from '@aws-cdk/aws-ec2';
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
    SUBSCRIPTION_ID_ATTRIBUTE,
    SUBSCRIPTIONS_PHONENUMBER_IDX_NAME,
    SUBSCRIPTIONS_TABLE_NAME, SUBSCRIPTIONS_TIME_IDX_NAME
} from "./db/db-subscriptions";

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

        const sendShiplistLambda = this.createSendShiplistLambda(vpc, lambdaDbSg, appProps);
        const schedulingCloudWatchRule = this.createSchedulingCloudWatchRule();
        schedulingCloudWatchRule.addTarget(new LambdaFunction(sendShiplistLambda));

        const smsHandlerLambda = this.createSmsHandlerLambda(incomingSmsTopic, appProps);

        const subscriptionTable = this.createSubscriptionTable();
        subscriptionTable.grantReadWriteData(smsHandlerLambda);
        subscriptionTable.grantReadData(sendShiplistLambda);

        PublicApi.create(vpc,
            lambdaDbSg,
            subscriptionTable,
            appProps,
            this);
    }

    private createSubscriptionTable(): Table {
        const table = new Table(this, 'subscription-table', {
            partitionKey: { name: SUBSCRIPTION_ID_ATTRIBUTE, type: AttributeType.STRING},
            sortKey: {name: 'Time', type: AttributeType.STRING},
            tableName: SUBSCRIPTIONS_TABLE_NAME,
            readCapacity: 1,
            writeCapacity: 1
        });
        table.addGlobalSecondaryIndex({
            indexName: SUBSCRIPTIONS_TIME_IDX_NAME,
            partitionKey: { name: 'Time', type: AttributeType.STRING }
        });
        table.addGlobalSecondaryIndex({
            indexName: SUBSCRIPTIONS_PHONENUMBER_IDX_NAME,
            partitionKey: { name: 'PhoneNumber', type: AttributeType.STRING }
        });

        return table;
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
                PINPOINT_ID: props.pinpointApplicationId,
                PINPOINT_NUMBER: props.pinpointTelephoneNumber,
                DB_USER: props.dbProps.username,
                DB_PASS: props.dbProps.password,
                DB_URI: props.dbProps.ro_uri
            }
        });
        sendShiplistLambda.addToRolePolicy(
            PortcallEstimateSubscriptionsStack.createWriteToPinpointPolicy(props.pinpointApplicationId));
        createSubscription(sendShiplistLambda, functionName, props.logsDestinationArn, this);
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
}
