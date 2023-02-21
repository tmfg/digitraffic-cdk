import { CfnRealtimeLogConfig } from "aws-cdk-lib/aws-cloudfront";
import { Duration, Stack } from "aws-cdk-lib";
import {
    Code,
    Runtime,
    StartingPosition,
    Tracing,
    Function as AWSFunction,
} from "aws-cdk-lib/aws-lambda";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Stream } from "aws-cdk-lib/aws-kinesis";
import { KinesisEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

import { CLOUDFRONT_STREAMING_LOG_FIELDS } from "./lambda/stream-to-elastic/logging-util";
import { ElasticProps } from "./app-props";

export interface StreamingConfig {
    kinesis: Stream;
    loggingConfig: CfnRealtimeLogConfig;
}

export function createRealtimeLogging(
    stack: Stack,
    writeToESRole: Role,
    appName: string,
    elasticProps: ElasticProps
): StreamingConfig {
    const kinesis = createKinesisStream(stack, appName);
    const kinesisWriteRole = createRealtimeLoggingRole(stack, appName, kinesis);
    const loggingConfig = createLoggingConfig(
        stack,
        appName,
        kinesis,
        kinesisWriteRole
    );

    createKinesisConsumerLambda(
        stack,
        appName,
        kinesis,
        elasticProps,
        writeToESRole
    );

    return {
        kinesis: kinesis,
        loggingConfig: loggingConfig,
    };
}

function createRealtimeLoggingRole(
    stack: Stack,
    appName: string,
    kinesis: Stream
): Role {
    const name = `WriteToKinesisRole-${appName}`;

    const role = new Role(stack, name, {
        assumedBy: new ServicePrincipal("cloudfront.amazonaws.com"),
        roleName: name,
    });

    role.addToPolicy(
        new PolicyStatement({
            actions: [
                "kinesis:DescribeStreamSummary",
                "kinesis:DescribeStream",
                "kinesis:PutRecord",
                "kinesis:PutRecords",
            ],
            resources: [kinesis.streamArn],
        })
    );

    return role;
}

function createKinesisStream(stack: Stack, appName: string): Stream {
    const streamName = `CloudfrontToElasticStream-${appName}`;

    //TODO need to create SNS topic for us-east-1
    //KinesisTools.monitorKinesisDataStream(this, streamName, )
    return new Stream(stack, streamName, {
        shardCount: 1,
        streamName: streamName,
        retentionPeriod: Duration.days(1),
    });
}

function createLoggingConfig(
    stack: Stack,
    appName: string,
    kinesis: Stream,
    role: Role
): CfnRealtimeLogConfig {
    return new CfnRealtimeLogConfig(stack, `RealtimeLogConfig-${appName}`, {
        endPoints: [
            {
                kinesisStreamConfig: {
                    streamArn: kinesis.streamArn,
                    roleArn: role.roleArn,
                },
                streamType: "Kinesis",
            },
        ],
        samplingRate: 100,
        name: `realtime-config-${appName}`,
        fields: CLOUDFRONT_STREAMING_LOG_FIELDS,
    });
}

function createKinesisConsumerLambda(
    stack: Stack,
    appName: string,
    kinesis: Stream,
    elasticProps: ElasticProps,
    writeToESRole: Role
) {
    const functionName = `RealtimeLoggingLambda-${appName}`;

    const dlq = new Queue(stack, "DLQ", {
        retentionPeriod: Duration.days(7),
        encryption: QueueEncryption.KMS_MANAGED,
    });

    const fn = new AWSFunction(stack, functionName, {
        functionName: functionName,
        runtime: Runtime.NODEJS_16_X,
        handler: "lambda-stream-to-elastic.handler",
        code: Code.fromAsset("dist/lambda/stream-to-elastic"),
        deadLetterQueue: dlq,
        tracing: Tracing.DISABLED,
        reservedConcurrentExecutions: 1,
        environment: {
            ELASTIC_DOMAIN: elasticProps.elasticDomain,
            APP_DOMAIN: appName,
        },
        role: writeToESRole,
        timeout: Duration.seconds(60),
        memorySize: elasticProps.streamingProps.memorySize ?? 256,
    });

    fn.addEventSource(
        new KinesisEventSource(kinesis, {
            batchSize: elasticProps.streamingProps.batchSize ?? 100,
            maxBatchingWindow: Duration.seconds(
                elasticProps.streamingProps.maxBatchingWindow ?? 20
            ),
            startingPosition: StartingPosition.LATEST,
        })
    );
    kinesis.grantRead(writeToESRole);

    return fn;
}
