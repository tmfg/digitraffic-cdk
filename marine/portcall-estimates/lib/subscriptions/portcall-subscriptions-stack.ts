import {Construct, Duration, Stack, StackProps} from '@aws-cdk/core';
import {ISecurityGroup, IVpc, SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
import {Props} from './app-props-subscriptions';
import * as PublicApi from './public-api';
import {Runtime} from '@aws-cdk/aws-lambda';
import {Topic} from "@aws-cdk/aws-sns";
import {dbLambdaConfiguration} from "../../../../common/stack/lambda-configs";
import {AssetCode, Function} from "@aws-cdk/aws-lambda";
import {SnsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {createSubscription} from "../../../../common/stack/subscription";
import {RetentionDays} from '@aws-cdk/aws-logs';
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";

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

        const createSubscriptionLambda = this.createSubscriptionCreatorLambda(
            incomingSmsTopic,
            vpc,
            lambdaDbSg,
            appProps);

        PublicApi.create(vpc,
            lambdaDbSg,
            createSubscriptionLambda,
            appProps, this);
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

    private createSubscriptionCreatorLambda(
        incomingSmsTopic: Topic,
        vpc: IVpc,
        lambdaDbSg: ISecurityGroup,
        props: Props): Function {
        const functionName = 'PortcallEstimateSubscriptions-CreateSubscription';
        const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
            functionName: functionName,
            code: new AssetCode('dist/subscriptions/lambda/create-subscription'),
            handler: 'lambda-create-subscription.handler',
            environment: {
                DB_USER: props.dbProps.username,
                DB_PASS: props.dbProps.password,
                DB_URI: props.dbProps.uri
            },
            reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
        });
        const subscriptionCreatorLambda = new Function(this, functionName, lambdaConf);
        subscriptionCreatorLambda.addEventSource(new SnsEventSource(incomingSmsTopic));
        createSubscription(subscriptionCreatorLambda, functionName, props.logsDestinationArn, this);
        return subscriptionCreatorLambda;
    }
}
