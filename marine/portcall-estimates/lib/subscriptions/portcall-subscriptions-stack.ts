import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {SecurityGroup, Vpc} from '@aws-cdk/aws-ec2';
import {Props} from './app-props-subscriptions';
import * as InternalLambdas from './internal-lambdas';

export class PortcallEstimateSubscriptionsStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        InternalLambdas.create(vpc, lambdaDbSg, appProps, this);
    }
}
