import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc} from '@aws-cdk/aws-ec2';
import * as IntegrationApi from './integration-api';
import * as InternalLambdas from './internal-lambdas';
import * as PublicApi from './public-api';
import {VoyagePlanGatewayProps} from "./app-props";
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {Topic} from "@aws-cdk/aws-sns";

export class VoyagePlanGatewayStack extends Stack {
    constructor(scope: Construct, id: string, appProps: VoyagePlanGatewayProps, props?: StackProps) {
        super(scope, id, props);

        const secret = Secret.fromSecretNameV2(this, 'VPGWSecret', appProps.secretId);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });

        const notifyTopicName = 'VPGW-NotifyTopic';
        const notifyTopic = new Topic(this, notifyTopicName, {
            topicName: notifyTopicName,
            displayName: notifyTopicName
        });

        IntegrationApi.create(secret, notifyTopic, appProps, this);
        InternalLambdas.create(secret, notifyTopic, vpc, appProps, this);
        PublicApi.create(secret, vpc, appProps, this);
    }
}
