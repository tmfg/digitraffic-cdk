import cdk = require('@aws-cdk/core');
import * as InternalLambdas from './internal-lambdas';
import * as ec2 from "@aws-cdk/aws-ec2";

export class Nordicway2CdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, nordicwayProps: Props, props?: cdk.StackProps) {
        super(scope, id, props);

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        const vpc = ec2.Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: nordicwayProps.vpcId,
            privateSubnetIds: nordicwayProps.privateSubnetIds,
            availabilityZones: nordicwayProps.availabilityZones
        });
        // security group that allows Lambda database access
        const lambdaDbSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', nordicwayProps.lambdaDbSgId);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        InternalLambdas.create(vpc, lambdaDbSg, this, nordicwayProps);
    }
}
