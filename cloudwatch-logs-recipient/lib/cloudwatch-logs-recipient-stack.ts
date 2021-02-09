///<reference path="../lib/app-props.d.ts"/>
import {Stack, StackProps, Construct}  from '@aws-cdk/core';
import {Role, ServicePrincipal, PolicyStatement} from '@aws-cdk/aws-iam';
import {CrossAccountDestination, CfnDestination, RetentionDays} from '@aws-cdk/aws-logs';
import {Stream} from '@aws-cdk/aws-kinesis';
import {Function, AssetCode, Runtime, StartingPosition} from '@aws-cdk/aws-lambda';
import {KinesisEventSource} from '@aws-cdk/aws-lambda-event-sources';
import {Duration} from "@aws-cdk/core";
import {Topic} from '@aws-cdk/aws-sns';
import {EmailSubscription} from '@aws-cdk/aws-sns-subscriptions';

export class CloudWatchLogsRecipientStack extends Stack {
    constructor(scope: Construct, id: string, cwlrProps: Props, props?: StackProps) {
        super(scope, id, props);

        // stream for logs generated in lambdas
        const lambdaLogsToESStream = this.createKinesisStream('CWLRecipientStream');
        // stream for logs generated in applications(web/daemon)
        const appLogsTOEsStream = this.createKinesisStream('AppLogRecipientStream');

        const writeLambdaLogsToKinesisRole = this.createWriteToKinesisStreamRole('CWLToKinesisRole', lambdaLogsToESStream.streamArn);
        const writeAppLogsToKinesisRole = this.createWriteToKinesisStreamRole('AppLogsToKinesisRole', appLogsTOEsStream.streamArn);

        const lambdaLogsCrossAccountDestination = this.createCrossAccountDestination('CrossAccountDestination',
            lambdaLogsToESStream.streamArn,
            writeLambdaLogsToKinesisRole,
            cwlrProps.accounts.map(a => a.accountNumber));
        const appLogsCrossAccountDestination =  this.createCrossAccountDestination('AppLogsCrossAccountDestination',
            appLogsTOEsStream.streamArn,
            writeAppLogsToKinesisRole,
            cwlrProps.accounts.map(a => a.accountNumber));

        const emailSqsTopic = this.createEmailTopic(cwlrProps.errorEmail);
        const accountsString = JSON.stringify(cwlrProps.accounts);

        const lambdaRole = this.createWriteToElasticLambdaRole(cwlrProps.elasticSearchDomainArn, [lambdaLogsToESStream.streamArn, appLogsTOEsStream.streamArn]);
        const lambdaLogsToESLambda = this.createWriteLambdaLogsToElasticLambda(lambdaRole, accountsString, cwlrProps.elasticSearchEndpoint);
        const appLogsToESLambda = this.createWriteAppLogsToElasticLambda(lambdaRole, accountsString, emailSqsTopic, cwlrProps.elasticSearchEndpoint);

        emailSqsTopic.grantPublish(appLogsToESLambda);

        lambdaLogsToESLambda.addEventSource(new KinesisEventSource(lambdaLogsToESStream, {
            startingPosition: StartingPosition.TRIM_HORIZON,
            batchSize: 10000,
            maxBatchingWindow: Duration.seconds(30)
        }));

        appLogsToESLambda.addEventSource(new KinesisEventSource(appLogsTOEsStream, {
            startingPosition: StartingPosition.TRIM_HORIZON,
            batchSize: 10000,
            maxBatchingWindow: Duration.seconds(30)
        }));
    }

    createEmailTopic(email: string): Topic {
        const topic = new Topic(this, 'KinesisErrorsToEmailTopic', {
            topicName: 'KinesisErrorsToEmailTopic'
        });

        topic.addSubscription(new EmailSubscription(email));

        return topic;
    }

    createCrossAccountDestination(crossAccountDestinationId: string, streamArn: string, writeToKinesisRole: Role, accountNumbers: string[]) {
        const crossAccountDestination = new CrossAccountDestination(
            this,
            crossAccountDestinationId,
            {
                destinationName: crossAccountDestinationId,
                targetArn: streamArn,
                role: writeToKinesisRole
            }
        );
        crossAccountDestination.node.addDependency(writeToKinesisRole);
        (crossAccountDestination.node.defaultChild as CfnDestination).destinationPolicy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'AllowSenderAccountsToSubscribe',
                    Effect: 'Allow',
                    Action: 'logs:PutSubscriptionFilter',
                    Principal: {
                        AWS: accountNumbers
                    },
                    Resource: `arn:aws:logs:${this.region}:${this.account}:destination:${crossAccountDestinationId}`
                }
            ]
        });
    }

    createKinesisStream(streamName: string) {
        return new Stream(this, streamName, {
            shardCount: 1,
            streamName: streamName
        });
    }

    createWriteToKinesisStreamRole(roleName: string, streamArn: string): Role {
        const cloudWatchLogsToKinesisRole = new Role(this, roleName, {
            assumedBy: new ServicePrincipal(
                `logs.${this.region}.amazonaws.com`
            ),
            roleName: roleName
        });

        cloudWatchLogsToKinesisRole.addToPolicy(
            new PolicyStatement({
                actions: ['kinesis:PutRecord'],
                resources: [streamArn]
            })
        );
        cloudWatchLogsToKinesisRole.addToPolicy(
            new PolicyStatement({
                actions: ['iam:PassRole'],
                resources: [cloudWatchLogsToKinesisRole.roleArn]
            })
        );

        return cloudWatchLogsToKinesisRole;
    }

    createWriteLambdaLogsToElasticLambda(lambdaRole: Role, accounts: string, esEndpoint: string): Function {
        const kinesisToESId = 'KinesisToES';
        const lambdaConf = {
            role: lambdaRole,
            functionName: kinesisToESId,
            code: new AssetCode('dist/lambda/', {exclude: ["app-*"]}),
            handler: 'lambda-kinesis-to-es.handler',
            runtime: Runtime.NODEJS_12_X,
            timeout: Duration.seconds(10),
            logRetention: RetentionDays.ONE_YEAR,
            environment: {
                KNOWN_ACCOUNTS: accounts,
                ES_ENDPOINT: esEndpoint
            }
        };
        return new Function(this, kinesisToESId, lambdaConf);
    }

    createWriteAppLogsToElasticLambda(lambdaRole: Role, accounts: string, topic: Topic, esEndpoint: string): Function {
        const kinesisToESId = 'AppLogs-KinesisToES';
        const lambdaConf = {
            role: lambdaRole,
            memorySize: 256,
            functionName: kinesisToESId,
            code: new AssetCode('dist/lambda/', {exclude: ["lambda-*"]}),
            handler: 'app-kinesis-to-es.handler',
            runtime: Runtime.NODEJS_12_X,
            timeout: Duration.seconds(20),
            logRetention: RetentionDays.ONE_YEAR,
            environment: {
                KNOWN_ACCOUNTS: accounts,
                ES_ENDPOINT: esEndpoint,
                TOPIC_ARN: topic.topicArn
            }
        };
        return new Function(this, kinesisToESId, lambdaConf);
    }

    createWriteToElasticLambdaRole(elasticSearchDomainArn: string, streamArns: string[]): Role {
        const lambdaRole = new Role(this, "KinesisLambdaToElasticSearchRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: "KinesisLambdaToElasticSearchRole"
        });
        lambdaRole.addToPolicy(
            new PolicyStatement({
                actions: [
                    "es:DescribeElasticsearchDomain",
                    "es:DescribeElasticsearchDomains",
                    "es:DescribeElasticsearchDomainConfig",
                    "es:ESHttpPost",
                    "es:ESHttpPut"
                ],
                resources: [
                    elasticSearchDomainArn,
                    `${elasticSearchDomainArn}/*`
                ]
            })
        );
        lambdaRole.addToPolicy(
            new PolicyStatement({
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
            new PolicyStatement({
                actions: [
                    "kinesis:DescribeStream",
                    "kinesis:DescribeStreamSummary",
                    "kinesis:GetRecords",
                    "kinesis:GetShardIterator",
                    "kinesis:ListShards",
                    "kinesis:ListStreams",
                    "kinesis:SubscribeToShard"
                ],
                resources: streamArns
            })
        );

        return lambdaRole;
    }

}
