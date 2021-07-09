import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
import {Secret} from "@aws-cdk/aws-secretsmanager";
import * as IntegrationApi from './integration-api';
import {AppProps} from './app-props'

export class SseStack extends Stack {
    constructor(scope: Construct, id: string, appProps: AppProps, props?: StackProps) {
        super(scope, id, props);

        const secret = Secret.fromSecretNameV2(this, 'SseSecret', appProps.secretId);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });
        // security group that allows Lambda database access
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        // InternalLambdas.create(queueAndDLQ, dlqBucket, vpc, lambdaDbSg, appProps, this);
        IntegrationApi.createIntegrationApiAndHandlerLambda(secret, vpc, lambdaDbSg, appProps, this);
    }
}
