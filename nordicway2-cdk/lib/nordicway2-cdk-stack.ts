import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as PublicApi from "./public-api";

export class Nordicway2CdkStack extends Stack {
    constructor(scope: Construct, id: string, nw2Props: NW2Props, props?: StackProps) {
        super(scope, id, props);

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: nw2Props.vpcId,
            privateSubnetIds: nw2Props.privateSubnetIds,
            availabilityZones: nw2Props.availabilityZones
        });
        // security group that allows Lambda database access
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', nw2Props.lambdaDbSgId);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        const internalLambda = InternalLambdas.create(vpc, lambdaDbSg, nw2Props, this);
        const publicLambda = PublicApi.create(vpc, lambdaDbSg, nw2Props, this);
    }
}
