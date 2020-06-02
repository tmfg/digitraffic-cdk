import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import * as IntegrationApi from "./integration-api";
import * as PublicApi from "./public-api";
import {LambdaConfiguration} from "../../common/stack/lambda-configs";

export class VariableSignsCdkStack extends Stack {
    constructor(scope: Construct, id: string, lambdaProps: LambdaConfiguration, props?: StackProps) {
        super(scope, id, props);

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: lambdaProps.vpcId,
            privateSubnetIds: lambdaProps.privateSubnetIds,
            availabilityZones: lambdaProps.availabilityZones
        });
        // security group that allows Lambda database access
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', lambdaProps.lambdaDbSgId);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        IntegrationApi.create(vpc, lambdaDbSg, lambdaProps, this);
        PublicApi.create(vpc, lambdaDbSg, lambdaProps, this);
    }
}
