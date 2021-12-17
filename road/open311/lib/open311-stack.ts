import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import * as InternalLambdas from './internal-lambdas';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import {Stack, StackProps} from "aws-cdk-lib";

export class Open311Stack extends Stack {
    constructor(scope: Construct, id: string, open311Props: Props, props?: StackProps) {
        super(scope, id, props);

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        const vpc = ec2.Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: open311Props.vpcId,
            privateSubnetIds: open311Props.privateSubnetIds,
            availabilityZones: open311Props.availabilityZones,
        });
        // security group that allows Lambda database access
        const lambdaDbSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', open311Props.lambdaDbSgId);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        IntegrationApi.create(vpc, lambdaDbSg, this, open311Props);
        PublicApi.create(vpc, lambdaDbSg, this, open311Props);
        InternalLambdas.create(vpc, lambdaDbSg, this, open311Props);
    }
}
