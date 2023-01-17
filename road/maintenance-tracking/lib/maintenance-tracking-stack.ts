import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Duration } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { AppProps } from "./app-props";
import * as IntegrationApi from "./integration-api";
import * as InternalLambdas from "./internal-lambdas";
import * as Sqs from "./sqs";

export class MaintenanceTrackingStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: AppProps) {
        super(scope, id, appProps);

        const queueAndDLQ = Sqs.createQueue(this);
        // Create bucket with internal id DLQBucket, that is not going to AWS and must be unique
        const dlqBucket = new Bucket(this, "DLQBucket", {
            bucketName: appProps.sqsDlqBucketName,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        });

        // Create bucket for SQS-messages and delete old messages from bucket after 30 day
        const sqsExtendedMessageBucket = new Bucket(
            this,
            "SqsExtendedMessageBucket",
            {
                blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
                bucketName: appProps.sqsMessageBucketName,
                lifecycleRules: [
                    {
                        enabled: true,
                        expiration: Duration.days(31),
                    },
                ],
            }
        );

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        // InternalLambdas.create(queueAndDLQ, dlqBucket, vpc, lambdaDbSg, appProps, this);
        IntegrationApi.createIntegrationApiAndHandlerLambda(
            queueAndDLQ.queue,
            sqsExtendedMessageBucket.bucketArn,
            appProps,
            this
        );

        InternalLambdas.createProcessQueueAndDlqLambda(
            queueAndDLQ,
            dlqBucket,
            sqsExtendedMessageBucket.bucketArn,
            appProps,
            this
        );

        // Delete over 26 hours old trackings from db
        InternalLambdas.createCleanMaintenanceTrackingDataLambda(this);
    }
}
