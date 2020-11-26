import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as PublicApi from './public-api';
import {Props} from './app-props'

export class BridgeLockDisruptionsStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        InternalLambdas.create(vpc, lambdaDbSg, appProps, this);
        PublicApi.create(vpc, lambdaDbSg, appProps, this);
    }
}
