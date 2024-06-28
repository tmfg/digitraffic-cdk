import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Role, ServicePrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CrossAccountDestination, CfnDestination, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Stream } from "aws-cdk-lib/aws-kinesis";
import {
    Function,
    FunctionProps,
    AssetCode,
    Runtime,
    StartingPosition,
    Architecture
} from "aws-cdk-lib/aws-lambda";
import { KinesisEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { ITopic, Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { Props } from "./app-props";

export class CloudWatchLogsRecipientStack extends Stack {
    constructor(scope: Construct, id: string, cwlrProps: Props, props?: StackProps) {
        super(scope, id, props);

        // stream for logs generated in lambdas
        const lambdaLogsToESStream = this.createKinesisStream("CWLRecipientStream");
        // stream for logs generated in applications(web/daemon)
        const appLogsTOEsStream = this.createKinesisStream("AppLogRecipientStream");

        const writeLambdaLogsToKinesisRole = this.createWriteToKinesisStreamRole(
            "CWLToKinesisRole",
            lambdaLogsToESStream.streamArn
        );
        const writeAppLogsToKinesisRole = this.createWriteToKinesisStreamRole(
            "AppLogsToKinesisRole",
            appLogsTOEsStream.streamArn
        );
        this.createCrossAccountDestination(
            "CrossAccountDestination",
            lambdaLogsToESStream.streamArn,
            writeLambdaLogsToKinesisRole,
            cwlrProps.accounts.map((a) => a.accountNumber)
        );
        this.createCrossAccountDestination(
            "AppLogsCrossAccountDestination",
            appLogsTOEsStream.streamArn,
            writeAppLogsToKinesisRole,
            cwlrProps.accounts.map((a) => a.accountNumber)
        );

        const emailSqsTopic = this.createEmailTopic(cwlrProps.errorEmail);
        const alarmTopic = Topic.fromTopicArn(this, "AlarmTopic", cwlrProps.alarmTopicArn);
        const warningTopic = Topic.fromTopicArn(this, "WarningTopic", cwlrProps.warningTopicArn);

        const lambdaRole = this.createWriteToElasticLambdaRole(cwlrProps.elasticSearchDomainArn, [
            lambdaLogsToESStream.streamArn,
            appLogsTOEsStream.streamArn
        ]);
        const lambdaLogsToESLambda = this.createWriteLambdaLogsToElasticLambda(
            lambdaRole,
            emailSqsTopic,
            warningTopic,
            alarmTopic,
            cwlrProps
        );
        const appLogsToESLambda = this.createWriteAppLogsToElasticLambda(
            lambdaRole,
            emailSqsTopic,
            warningTopic,
            alarmTopic,
            cwlrProps
        );

        emailSqsTopic.grantPublish(appLogsToESLambda);

        lambdaLogsToESLambda.addEventSource(
            new KinesisEventSource(lambdaLogsToESStream, {
                parallelizationFactor: 2,
                startingPosition: StartingPosition.TRIM_HORIZON,
                batchSize: 200,
                maxBatchingWindow: Duration.seconds(30)
            })
        );

        appLogsToESLambda.addEventSource(
            new KinesisEventSource(appLogsTOEsStream, {
                parallelizationFactor: 2,
                startingPosition: StartingPosition.TRIM_HORIZON,
                batchSize: 200,
                maxBatchingWindow: Duration.seconds(30)
            })
        );
    }

    createEmailTopic(email: string): Topic {
        const topic = new Topic(this, "KinesisErrorsToEmailTopic", {
            topicName: "KinesisErrorsToEmailTopic"
        });

        topic.addSubscription(new EmailSubscription(email));

        return topic;
    }

    createCrossAccountDestination(
        crossAccountDestinationId: string,
        streamArn: string,
        writeToKinesisRole: Role,
        accountNumbers: string[]
    ) {
        const crossAccountDestination = new CrossAccountDestination(this, crossAccountDestinationId, {
            destinationName: crossAccountDestinationId,
            targetArn: streamArn,
            role: writeToKinesisRole
        });
        crossAccountDestination.node.addDependency(writeToKinesisRole);
        (crossAccountDestination.node.defaultChild as CfnDestination).destinationPolicy = JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "AllowSenderAccountsToSubscribe",
                    Effect: "Allow",
                    Action: "logs:PutSubscriptionFilter",
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
            assumedBy: new ServicePrincipal(`logs.${this.region}.amazonaws.com`),
            roleName: roleName
        });

        cloudWatchLogsToKinesisRole.addToPolicy(
            new PolicyStatement({
                actions: ["kinesis:PutRecord"],
                resources: [streamArn]
            })
        );
        cloudWatchLogsToKinesisRole.addToPolicy(
            new PolicyStatement({
                actions: ["iam:PassRole"],
                resources: [cloudWatchLogsToKinesisRole.roleArn]
            })
        );

        return cloudWatchLogsToKinesisRole;
    }

    createWriteLambdaLogsToElasticLambda(
        lambdaRole: Role,
        topic: ITopic,
        warningTopic: ITopic,
        alarmTopic: ITopic,
        props: Props
    ): Function {
        const kinesisToESId = "KinesisToES";
        const lambdaConf = {
            role: lambdaRole,
            functionName: kinesisToESId,
            architectures: [Architecture.ARM_64],
            code: new AssetCode("dist/lambda/", { exclude: ["app-*"] }),
            handler: "lambda-kinesis-to-es.handler",
            runtime: Runtime.NODEJS_20_X,
            timeout: Duration.seconds(30),
            logRetention: RetentionDays.ONE_YEAR,
            memorySize: 512,
            environment: {
                KNOWN_ACCOUNTS: JSON.stringify(props.accounts),
                ES_ENDPOINT: props.elasticSearchEndpoint,
                TOPIC_ARN: topic.topicArn
            }
        } as FunctionProps;

        return new MonitoredFunction(
            this,
            kinesisToESId,
            { ...lambdaConf, ...props.lambdaConfig },
            alarmTopic,
            warningTopic,
            true,
            null
        );
    }

    createWriteAppLogsToElasticLambda(
        lambdaRole: Role,
        topic: ITopic,
        warningTopic: ITopic,
        alarmTopic: ITopic,
        props: Props
    ): Function {
        const kinesisToESId = "AppLogs-KinesisToES";
        const lambdaConf = {
            role: lambdaRole,
            memorySize: 256,
            functionName: kinesisToESId,
            architectures: [Architecture.ARM_64],
            code: new AssetCode("dist/lambda/", { exclude: ["lambda-*"] }),
            handler: "app-kinesis-to-es.handler",
            runtime: Runtime.NODEJS_20_X,
            timeout: Duration.seconds(30),
            logRetention: RetentionDays.ONE_YEAR,
            environment: {
                KNOWN_ACCOUNTS: JSON.stringify(props.accounts),
                ES_ENDPOINT: props.elasticSearchEndpoint,
                TOPIC_ARN: topic.topicArn
            }
        } as FunctionProps;

        return new MonitoredFunction(
            this,
            kinesisToESId,
            { ...lambdaConf, ...props.lambdaConfig },
            alarmTopic,
            warningTopic,
            true,
            null
        );
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
                resources: [elasticSearchDomainArn, `${elasticSearchDomainArn}/*`]
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
