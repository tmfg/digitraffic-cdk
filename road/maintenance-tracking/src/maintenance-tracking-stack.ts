import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Duration } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import * as IntegrationApi from "./integration-api.js";
import * as InternalLambdas from "./internal-lambdas.js";
import type { MaintenanceTrackingStackConfiguration } from "./maintenance-tracking-stack-configuration.js";
import * as Sqs from "./sqs.js";

export class MaintenanceTrackingStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, stackConfiguration: MaintenanceTrackingStackConfiguration) {
        super(scope, id, stackConfiguration);

        const queueAndDLQ = Sqs.createQueue(this);
        // Create bucket with internal id DLQBucket, that is not going to AWS and must be unique
        const dlqBucket = new Bucket(this, "DLQBucket", {
            bucketName: stackConfiguration.sqsDlqBucketName,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL
        });

        // Create bucket for SQS-messages and delete old messages from bucket after 30 day
        const sqsExtendedMessageBucket = new Bucket(this, "SqsExtendedMessageBucket", {
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            bucketName: stackConfiguration.sqsMessageBucketName,
            lifecycleRules: [
                {
                    enabled: true,
                    expiration: Duration.days(31)
                }
            ]
        });

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        // InternalLambdas.create(queueAndDLQ, dlqBucket, vpc, lambdaDbSg, appProps, this);
        IntegrationApi.createIntegrationApiAndHandlerLambda(
            queueAndDLQ.queue,
            sqsExtendedMessageBucket.bucketArn,
            stackConfiguration,
            this
        );

        InternalLambdas.createProcessQueueAndDlqLambda(
            queueAndDLQ,
            dlqBucket,
            sqsExtendedMessageBucket.bucketArn,
            stackConfiguration,
            this
        );

        // Delete over 26 hours old trackings from db
        InternalLambdas.createCleanMaintenanceTrackingDataLambda(this);
    }
}
