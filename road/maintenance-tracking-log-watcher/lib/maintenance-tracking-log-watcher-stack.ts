///<reference path="../lib/app-props.d.ts"/>
import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam'
import {Props} from './app-props';
import {Bucket, BlockPublicAccess} from "@aws-cdk/aws-s3";
import {KEY_ES_ENDPOINT, KEY_S3_BUCKET_NAME, KEY_SNS_TOPIC_ARN} from "./lambda/maintenance-tracking-log-watcher";
import {defaultLambdaConfiguration} from "../../../common/stack/lambda-configs";
import {Rule,Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import * as sns from '@aws-cdk/aws-sns';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';

export class MaintenanceTrackingLogWatcherStack extends Stack {

    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const lambdaRole = new Role(this, "MaintenanceTrackingLogWatcherStackLambdaElasticSearchRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: "MaintenanceTrackingLogWatcherStackLambdaElasticSearchRole"
        });
        lambdaRole.addToPolicy(
            new PolicyStatement({
                actions: [
                    "es:ESHttpPost"
                ],
                resources: [
                    appProps.elasticSearchDomainArn,
                    `${appProps.elasticSearchDomainArn}/*`
                ]
            })
        );

        const logBucket = new Bucket(this, 'LogBucket', {
            bucketName: `${appProps.s3BucketName}-${appProps.app}-${appProps.env}`,
            versioned: false,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL
        });

        const emailTopic = new sns.Topic(this, 'MaintenanceTrackingLogWatcherTopic');
        for (const email of appProps.emails) {
            emailTopic.addSubscription(new subscriptions.EmailSubscription(email));
        }

        const lambdaFunction = createWatchLogAndUploadToS3Lambda(appProps, lambdaRole, emailTopic, logBucket.bucketName, this);

        const rule = new Rule(this, 'Rule', {
            schedule: Schedule.cron( { hour: '01', weekDay: 'MON'  } )
        });
        rule.addTarget(new LambdaFunction(lambdaFunction));

        const statement = new PolicyStatement();
        statement.addActions('s3:PutObject');
        statement.addActions('s3:PutObjectAcl');
        statement.addResources(logBucket.bucketArn + '/*');

        lambdaFunction.addToRolePolicy(statement);
        emailTopic.grantPublish(lambdaFunction);
    }
}

function createWatchLogAndUploadToS3Lambda (
    appProps: Props,
    role: Role,
    topic: sns.Topic,
    s3Bucketname : string,
    stack: Stack): Function {

    const environment: any = {};
    environment[KEY_ES_ENDPOINT] = appProps.elasticSearchEndpoint;
    environment[KEY_S3_BUCKET_NAME] = s3Bucketname;
    environment[KEY_SNS_TOPIC_ARN] = topic.topicArn;

    const functionName = 'MaintenanceTrackingLogWatcher';
    const lambdaConf = defaultLambdaConfiguration({
        functionName: functionName,
        code: new AssetCode('dist/lambda'),
        handler: 'maintenance-tracking-log-watcher.handler',
        role: role,
        environment
    });

    return new Function(stack, functionName, lambdaConf);
}