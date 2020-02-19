import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as PublicApi from './public-api';

export class NavaidFaultsCdkStack extends Stack {
    constructor(scope: Construct, id: string, navaidFaultsProps: NavaidFaultsProps, props?: StackProps) {
        super(scope, id, props);

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: navaidFaultsProps.vpcId,
            privateSubnetIds: navaidFaultsProps.privateSubnetIds,
            availabilityZones: navaidFaultsProps.availabilityZones
        });
        // security group that allows Lambda database access
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', navaidFaultsProps.lambdaDbSgId);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        const internalLambda = InternalLambdas.create(vpc, lambdaDbSg, navaidFaultsProps, this);
        const publicLambda = PublicApi.create(vpc, lambdaDbSg, navaidFaultsProps, this);
    }
}
