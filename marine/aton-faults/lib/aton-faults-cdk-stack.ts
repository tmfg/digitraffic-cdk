import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {Secret} from "@aws-cdk/aws-secretsmanager";

export class AtonFaultsCdkStack extends Stack {
    constructor(scope: Construct, id: string, atonFaultsProps: AtonProps, props?: StackProps) {
        super(scope, id, props);

        const secret = Secret.fromSecretNameV2(this, 'AtonSecret', atonFaultsProps.secretId);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: atonFaultsProps.vpcId,
            privateSubnetIds: atonFaultsProps.privateSubnetIds,
            availabilityZones: atonFaultsProps.availabilityZones
        });
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', atonFaultsProps.lambdaDbSgId);

        const sendFaultTopicName = 'ATON-SendFaultTopic';
        const sendFaultTopic = new Topic(this, sendFaultTopicName, {
            topicName: sendFaultTopicName,
            displayName: sendFaultTopicName
        });

        IntegrationApi.create(secret, sendFaultTopic, vpc, lambdaDbSg, atonFaultsProps, this);
        InternalLambdas.create(secret, sendFaultTopic, vpc, lambdaDbSg, atonFaultsProps, this);
    }
}
