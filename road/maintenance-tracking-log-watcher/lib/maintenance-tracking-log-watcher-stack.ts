///<reference path="../lib/app-props.d.ts"/>
import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam'
import {Props} from './app-props';
import {Bucket, BlockPublicAccess} from "@aws-cdk/aws-s3";
import {KEY_ES_ENDPOINT, KEY_S3_BUCKET_NAME} from "./lambda/maintenance-tracking-log-watcher";
import {defaultLambdaConfiguration} from "../../../common/stack/lambda-configs";
import {Rule,Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';

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

        const lambdaFunction = createWatchLogAndUploadToS3Lambda(appProps, lambdaRole, logBucket.bucketName, this);

        const rule = new Rule(this, 'Rule', {
            schedule: Schedule.cron( { hour: '01' } )
        });
        rule.addTarget(new LambdaFunction(lambdaFunction));

        const statement = new PolicyStatement();
        statement.addActions('s3:PutObject');
        statement.addActions('s3:PutObjectAcl');
        statement.addResources(logBucket.bucketArn + '/*');
        lambdaFunction.addToRolePolicy(statement);
    }
}

function createWatchLogAndUploadToS3Lambda (
    appProps: Props,
    role: Role,
    s3Bucketname : string,
    stack: Stack): Function {

    const environment: any = {};
    environment[KEY_ES_ENDPOINT] = appProps.elasticSearchEndpoint;
    environment[KEY_S3_BUCKET_NAME] = s3Bucketname;

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