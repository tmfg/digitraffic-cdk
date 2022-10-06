import {Stack, StackProps} from 'aws-cdk-lib';
import {Rule, Schedule} from 'aws-cdk-lib/aws-events';
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets';
import {PolicyStatement, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {AssetCode, Function} from 'aws-cdk-lib/aws-lambda';
import {BlockPublicAccess, Bucket} from "aws-cdk-lib/aws-s3";
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import {Construct} from "constructs";
import {defaultLambdaConfiguration, LambdaEnvironment} from "@digitraffic/common/aws/infra/stack/lambda-configs";
import {Props} from './app-props';
import {KEY_ES_ENDPOINT, KEY_S3_BUCKET_NAME, KEY_SNS_TOPIC_ARN} from "./lambda/maintenance-tracking-log-watcher";

export class MaintenanceTrackingLogWatcherStack extends Stack {

    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const lambdaRole = createLambdaRole(this, appProps);
        const logBucket = createLogBucket(this, appProps);
        const emailTopic = createEmailTopic(this, appProps);
        const lambdaFunction = createWatchLogAndUploadToS3Lambda(
            appProps, lambdaRole, emailTopic, logBucket.bucketName, this,
        );
        const s3WritePolicy = createWritePolicyToS3(logBucket.bucketArn);

        createLambdaTrigger(this, lambdaFunction);

        lambdaFunction.addToRolePolicy(s3WritePolicy);
        emailTopic.grantPublish(lambdaFunction);
    }
}

function createLambdaRole(stack: Stack, appProps: Props) {
    const lambdaRole = new Role(stack, "MaintenanceTrackingLogWatcherStackLambdaElasticSearchRole", {
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
        roleName: "MaintenanceTrackingLogWatcherStackLambdaElasticSearchRole",
    });
    lambdaRole.addToPolicy(new PolicyStatement({
        actions: [
            "es:ESHttpPost",
        ],
        resources: [
            appProps.elasticSearchDomainArn,
            `${appProps.elasticSearchDomainArn}/*`,
        ],
    }));
    return lambdaRole;
}

function createLogBucket(stack: Stack, appProps: Props) {
    return new Bucket(stack, 'LogBucket', {
        bucketName: `${appProps.s3BucketName}-${appProps.app}-${appProps.env}`,
        versioned: false,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });
}

function createEmailTopic(stack: Stack, appProps: Props) {
    const emailTopic = new sns.Topic(stack, 'MaintenanceTrackingLogWatcherTopic');
    for (const email of appProps.emails) {
        emailTopic.addSubscription(new subscriptions.EmailSubscription(email));
    }
    return emailTopic;
}

function createLambdaTrigger(stack: Stack, lambdaFunction: Function) {
    const rule = new Rule(stack, 'MaintenanceTrackingLogWatcherScheduler', {
        schedule: Schedule.cron( { weekDay: 'MON', hour: '1', minute: '0' } ),
    });
    rule.addTarget(new LambdaFunction(lambdaFunction));
}

function createWritePolicyToS3(s3BucketArn: string): PolicyStatement {
    const statement = new PolicyStatement();
    statement.addActions('s3:PutObject');
    statement.addActions('s3:PutObjectAcl');
    statement.addResources(s3BucketArn + '/*');
    return statement;
}

function createWatchLogAndUploadToS3Lambda (
    appProps: Props,
    role: Role,
    topic: sns.Topic,
    s3Bucketname : string,
    stack: Stack,
): Function {

    const environment: LambdaEnvironment = {};
    environment[KEY_ES_ENDPOINT] = appProps.elasticSearchEndpoint;
    environment[KEY_S3_BUCKET_NAME] = s3Bucketname;
    environment[KEY_SNS_TOPIC_ARN] = topic.topicArn;

    const functionName = 'MaintenanceTrackingLogWatcher';
    const lambdaConf = defaultLambdaConfiguration({
        functionName: functionName,
        code: new AssetCode('dist/lambda'),
        handler: 'maintenance-tracking-log-watcher.handler',
        role: role,
        environment,
    });

    return new Function(stack, functionName, lambdaConf);
}