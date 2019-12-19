///<reference path="../lib/app-props.d.ts"/>
import cdk = require('@aws-cdk/core');
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdaEventSources from '@aws-cdk/aws-lambda-event-sources';
import {Duration} from "@aws-cdk/core";

export class CloudWatchLogsRecipientStack extends cdk.Stack {

    constructor(scope: cdk.Construct, id: string, cwlrProps: Props, props?: cdk.StackProps) {
        super(scope, id, props);

        const recipientStream = new kinesis.Stream(this, 'CWLRecipientStream', {
            shardCount: 1,
            streamName: 'CWLRecipientStream'
        });

        const cloudWatchLogsToKinesisRole = new iam.Role(this, 'CWLToKinesisRole', {
            assumedBy: new iam.ServicePrincipal(
                `logs.${this.region}.amazonaws.com`
            ),
            roleName: 'CWLToKinesisRole'
        });

        cloudWatchLogsToKinesisRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['kinesis:PutRecord'],
                resources: [recipientStream.streamArn]
            })
        );
        cloudWatchLogsToKinesisRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['iam:PassRole'],
                resources: [cloudWatchLogsToKinesisRole.roleArn]
            })
        );

        const crossAccountDestinationId = 'CrossAccountDestination'
        // KinesisDestination requires reference to LogGroup which exists in another stack
        const crossAccountDestination = new logs.CrossAccountDestination(
            this,
            crossAccountDestinationId,
            {
                destinationName: crossAccountDestinationId,
                targetArn: recipientStream.streamArn,
                role: cloudWatchLogsToKinesisRole
            }
        );
        crossAccountDestination.node.addDependency(cloudWatchLogsToKinesisRole);
        (crossAccountDestination.node.defaultChild as logs.CfnDestination).destinationPolicy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'AllowSenderAccountsToSubscribe',
                    Effect: 'Allow',
                    Action: 'logs:PutSubscriptionFilter',
                    Principal: {
                        AWS: cwlrProps.accounts.map(a => a.accountNumber)
                    },
                    Resource: `arn:aws:logs:${this.region}:${this.account}:destination:${crossAccountDestinationId}`
                }
            ]
        });

        const lambdaRole = new iam.Role(this, "KinesisLambdaToElasticSearchRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            roleName: "KinesisLambdaToElasticSearchRole"
        });
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    "es:DescribeElasticsearchDomain",
                    "es:DescribeElasticsearchDomains",
                    "es:DescribeElasticsearchDomainConfig",
                    "es:ESHttpPost",
                    "es:ESHttpPut"
                ],
                resources: [
                    cwlrProps.elasticSearchDomainArn,
                    `${cwlrProps.elasticSearchDomainArn}/*`
                ]
            })
        );
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:CreateLogGroup",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                resources: ["*"]
            })
        );
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    "kinesis:DescribeStream",
                    "kinesis:DescribeStreamSummary",
                    "kinesis:GetRecords",
                    "kinesis:GetShardIterator",
                    "kinesis:ListShards",
                    "kinesis:ListStreams",
                    "kinesis:SubscribeToShard"
                ],
                resources: [recipientStream.streamArn]
            })
        );

        const kinesisToESId = 'KinesisToES';
        const lambdaConf = {
            role: lambdaRole,
            functionName: kinesisToESId,
            code: new lambda.AssetCode('dist/lambda'),
            handler: 'lambda-kinesis-to-es.handler',
            runtime: lambda.Runtime.NODEJS_10_X,
            timeout: Duration.seconds(10),
            logRetention: logs.RetentionDays.ONE_YEAR,
            environment: {
                KNOWN_ACCOUNTS: JSON.stringify(cwlrProps.accounts),
                ES_ENDPOINT: cwlrProps.elasticSearchEndpoint
            }
        };
        const kinesisToESLambda = new lambda.Function(this, kinesisToESId, lambdaConf);
        kinesisToESLambda.addEventSource(new lambdaEventSources.KinesisEventSource(recipientStream, {
            startingPosition: lambda.StartingPosition.TRIM_HORIZON
        }));
    }

}
