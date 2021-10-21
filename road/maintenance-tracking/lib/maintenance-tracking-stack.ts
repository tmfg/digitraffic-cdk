import {Construct, Duration, Stack, StackProps} from '@aws-cdk/core';
import {SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as Sqs from './sqs';
import {AppProps} from './app-props'
import {BlockPublicAccess, Bucket} from "@aws-cdk/aws-s3";
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export class MaintenanceTrackingStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: AppProps) {
        super(scope, id, appProps);

        const secret = Secret.fromSecretNameV2(this, 'MaintenanceTrackingSecret', appProps.secretId);

        const queueAndDLQ = Sqs.createQueue(this);
        // Create bucket with internal id DLQBucket, that is not going to AWS and must be unique
        const dlqBucket = new Bucket(this, 'DLQBucket', {
            bucketName: appProps.sqsDlqBucketName,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL
        });

        // Create bucket for SQS-messages and delete old messages from bucket after 30 day
        const sqsExtendedMessageBucket = new Bucket(this, 'SqsExtendedMessageBucket', {
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            bucketName: appProps.sqsMessageBucketName,
            lifecycleRules: [
                {
                    enabled: true,
                    expiration: Duration.days(31)
                }
            ]
        });

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        // InternalLambdas.create(queueAndDLQ, dlqBucket, vpc, lambdaDbSg, appProps, this);
        IntegrationApi.createIntegrationApiAndHandlerLambda(queueAndDLQ.queue, sqsExtendedMessageBucket.bucketArn, appProps, this);

        InternalLambdas.createProcessQueueAndDlqLambda(queueAndDLQ, dlqBucket, sqsExtendedMessageBucket.bucketArn, appProps, secret, this);
    }
}
