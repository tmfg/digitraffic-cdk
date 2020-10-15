import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as Sqs from './sqs';
import {AppProps} from './app-props'
import {Bucket} from "@aws-cdk/aws-s3";

export class MaintenanceTrackingStack extends Stack {
    constructor(scope: Construct, id: string, appProps: AppProps, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        const queueAndDLQ = Sqs.createQueue(this);
        // Create bucket with internal id DLQBucket, that is not going to AWS and must be unique
        const dlqBucket = new Bucket(this, 'DLQBucket', {
            bucketName: appProps.dlqBucketName
        });

        InternalLambdas.create(queueAndDLQ, dlqBucket, vpc, lambdaDbSg, appProps, this);
        IntegrationApi.createIntegrationApi(queueAndDLQ.queue, vpc, lambdaDbSg, appProps, this);
    }
}
