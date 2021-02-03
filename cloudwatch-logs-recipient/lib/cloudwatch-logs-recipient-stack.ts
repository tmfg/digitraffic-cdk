///<reference path="../lib/app-props.d.ts"/>
import {Stack, StackProps, Construct}  from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as kinesis from '@aws-cdk/aws-kinesis';
import {Function, AssetCode, Runtime, StartingPosition} from '@aws-cdk/aws-lambda';
import * as lambdaEventSources from '@aws-cdk/aws-lambda-event-sources';
import {Duration} from "@aws-cdk/core";

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

        const lambdaRole = this.createWriteToElasticLambdaRole(cwlrProps.elasticSearchDomainArn, [lambdaLogsToESStream.streamArn, appLogsTOEsStream.streamArn]);
        const lambdaLogsToESLambda = this.createWriteLambdaLogsToElasticLambda(lambdaRole, JSON.stringify(cwlrProps.accounts), cwlrProps.elasticSearchEndpoint);
        const appLogsToESLambda = this.createWriteAppLogsToElasticLambda(lambdaRole, cwlrProps.elasticSearchEndpoint);

        lambdaLogsToESLambda.addEventSource(new lambdaEventSources.KinesisEventSource(lambdaLogsToESStream, {
            startingPosition: StartingPosition.TRIM_HORIZON
        }));

        appLogsToESLambda.addEventSource(new lambdaEventSources.KinesisEventSource(appLogsTOEsStream, {
            startingPosition: StartingPosition.TRIM_HORIZON
        }));
    }

    createCrossAccountDestination(crossAccountDestinationId: string, streamArn: string, writeToKinesisRole: iam.Role, accountNumbers: string[]) {
        const crossAccountDestination = new logs.CrossAccountDestination(
            this,
            crossAccountDestinationId,
            {
                destinationName: crossAccountDestinationId,
                targetArn: streamArn,
                role: writeToKinesisRole
            }
        );
        crossAccountDestination.node.addDependency(writeToKinesisRole);
        (crossAccountDestination.node.defaultChild as logs.CfnDestination).destinationPolicy = JSON.stringify({
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
        return new kinesis.Stream(this, streamName, {
            shardCount: 1,
            streamName: streamName
        });
    }

    createWriteToKinesisStreamRole(roleName: string, streamArn: string): iam.Role {
        const cloudWatchLogsToKinesisRole = new iam.Role(this, roleName, {
            assumedBy: new iam.ServicePrincipal(
                `logs.${this.region}.amazonaws.com`
            ),
            roleName: roleName
        });

        cloudWatchLogsToKinesisRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['kinesis:PutRecord'],
                resources: [streamArn]
            })
        );
        cloudWatchLogsToKinesisRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['iam:PassRole'],
                resources: [cloudWatchLogsToKinesisRole.roleArn]
            })
        );

        return cloudWatchLogsToKinesisRole;
    }

    createWriteLambdaLogsToElasticLambda(lambdaRole: iam.Role, accounts: string, esEndpoint: string): Function {
        const kinesisToESId = 'KinesisToES';
        const lambdaConf = {
            role: lambdaRole,
            functionName: kinesisToESId,
            code: new AssetCode('dist/lambda/', {exclude: ["app-*"]}),
            handler: 'lambda-kinesis-to-es.handler',
            runtime: Runtime.NODEJS_12_X,
            timeout: Duration.seconds(10),
            logRetention: logs.RetentionDays.ONE_YEAR,
            environment: {
                KNOWN_ACCOUNTS: accounts,
                ES_ENDPOINT: esEndpoint
            }
        };
        return new Function(this, kinesisToESId, lambdaConf);
    }

    createWriteAppLogsToElasticLambda(lambdaRole: iam.Role, esEndpoint: string): Function {
        const kinesisToESId = 'AppLogs-KinesisToES';
        const lambdaConf = {
            role: lambdaRole,
            memorySize: 128,
            functionName: kinesisToESId,
            code: new AssetCode('dist/lambda/', {exclude: ["lambda-*"]}),
            handler: 'app-kinesis-to-es.handler',
            runtime: Runtime.NODEJS_12_X,
            timeout: Duration.seconds(20),
            logRetention: logs.RetentionDays.ONE_YEAR,
            environment: {
                ES_ENDPOINT: esEndpoint
            }
        };
        return new Function(this, kinesisToESId, lambdaConf);
    }

    createWriteToElasticLambdaRole(elasticSearchDomainArn: string, streamArns: string[]): iam.Role {
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
                    elasticSearchDomainArn,
                    `${elasticSearchDomainArn}/*`
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
                resources: streamArns
            })
        );

        return lambdaRole;
    }

}
