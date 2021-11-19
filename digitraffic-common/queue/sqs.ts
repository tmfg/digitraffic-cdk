import {Queue, QueueEncryption, QueueProps} from "@aws-cdk/aws-sqs";
import {Construct, Duration} from "@aws-cdk/core";
import {DigitrafficStack} from "../stack/stack";
import {BlockPublicAccess, Bucket} from "@aws-cdk/aws-s3";
import {MonitoredFunction} from "../lambda/monitoredfunction";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {InlineCode, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {ComparisonOperator, TreatMissingData} from "@aws-cdk/aws-cloudwatch";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {S3} from "aws-sdk";
import {ManagedUpload} from "aws-sdk/clients/s3";

/**
 * Construct for creating SQS-queues.
 *
 * If you don't config your own deadLetterQueue, this will create a dlq for you, also a lambda function, a s3 bucket
 * and an alarm for the queue.  Anything that goes to the dlq will be written into the bucket and the alarm is activated.
 */
export class DigitrafficSqsQueue extends Queue {
    constructor(scope: Construct, name: string, props: QueueProps) {
        super(scope, name, props);
    }

    static create(stack: DigitrafficStack, name: string, props: QueueProps): DigitrafficSqsQueue {
        const queueName = `${stack.configuration.shortName}-${name}-Queue`;
        const queueProps = {...props, ...{
            encryption: QueueEncryption.KMS_MANAGED,
            queueName,
            deadLetterQueue: props.deadLetterQueue || {
                maxReceiveCount: 2,
                queue: DigitrafficDLQueue.create(stack, name)
            }
        }};

        return new DigitrafficSqsQueue(stack, queueName, queueProps);
    }
}

export class DigitrafficDLQueue {
    static create(stack: DigitrafficStack, name: string): DigitrafficSqsQueue {
        const dlqName = `${stack.configuration.shortName}-${name}-DLQ`;

        const dlq = new DigitrafficSqsQueue(stack, dlqName, {
            queueName: dlqName,
            visibilityTimeout: Duration.seconds(60),
            encryption: QueueEncryption.KMS_MANAGED,
        });

        const dlqBucket = new Bucket(stack, `${dlqName}-Bucket`, {
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL
        });

        const dlqFunctionName = `${dlqName}-Function`;
        const lambda = MonitoredFunction.create(stack, dlqFunctionName, {
            runtime: Runtime.NODEJS_12_X,
            logRetention: RetentionDays.ONE_YEAR,
            functionName: dlqFunctionName,
            code: getDlqCode(dlqBucket.bucketName),
            timeout: Duration.seconds(10),
            handler: 'index.handler',
            memorySize: 128,
            reservedConcurrentExecutions: 1
        });

        const statement = new PolicyStatement();
        statement.addActions('s3:PutObject');
        statement.addActions('s3:PutObjectAcl');
        statement.addResources(dlqBucket.bucketArn + '/*');

        lambda.addToRolePolicy(statement);
        lambda.addEventSource(new SqsEventSource(dlq));

        addDLQAlarm(stack, dlqName, dlq);

        return dlq;
    }
}

function addDLQAlarm(stack: DigitrafficStack, dlqName: string, dlq: Queue) {
    const alarmName = `${dlqName}-Alarm`;
    dlq.metricNumberOfMessagesReceived({
        period: Duration.minutes(5)
    }).createAlarm(stack, alarmName, {
        alarmName,
        threshold: 0,
        evaluationPeriods: 1,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD
    }).addAlarmAction(new SnsAction(stack.warningTopic));
}

function getDlqCode(bucketName: string): InlineCode {
    const functionBody = DLQ_LAMBDA_CODE
        .replace('_bucketName_',bucketName)
        .replace("__upload__", uploadToS3.toString())
        .replace("__doUpload__", doUpload.toString());

    return new InlineCode(functionBody);
}

async function uploadToS3(s3: S3, bucketName: string, body: string, objectName: string): Promise<void> {
    try {
        console.info('writing %s to %s', objectName, bucketName);
        await doUpload(s3, bucketName, body, objectName);
    } catch (error) {
        console.warn(error);
        console.warn('method=uploadToS3 retrying upload to bucket %s', bucketName);
        try {
            await doUpload(s3, bucketName, body, objectName);
        } catch (error) {
            console.error('method=uploadToS3 failed retrying upload to bucket %s', bucketName);
        }
    }
}

function doUpload(s3: S3, Bucket: string, Body: string, Key: string): Promise<ManagedUpload.SendData> {
    return s3.upload({
        Bucket, Body, Key
    }).promise();
}

const DLQ_LAMBDA_CODE = `const AWS = require('aws-sdk');

__upload__
__doUpload__

exports.handler = async (event) => {
    const millis = new Date().getTime();
    return Promise.all(event.Records.map((e, idx) =>
        uploadToS3(new AWS.S3(), '_bucketName_', e.body, \`dlq-$\{millis\}-$\{idx\}.json\`)
    ));
};
`;
