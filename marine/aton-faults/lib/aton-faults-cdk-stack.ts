import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";

export class AtonFaultsCdkStack extends Stack {
    constructor(scope: Construct, id: string, atonFaultsProps: AtonProps, props?: StackProps) {
        super(scope, id, props);

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

        IntegrationApi.create(sendFaultTopic, vpc, lambdaDbSg, atonFaultsProps, this);
        InternalLambdas.create(sendFaultTopic, vpc, lambdaDbSg, atonFaultsProps, this);
    }
}
