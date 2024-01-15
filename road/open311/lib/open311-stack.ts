import * as IntegrationApi from "./integration-api";
import * as PublicApi from "./public-api";
import * as InternalLambdas from "./internal-lambdas";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Aspects, Stack, StackProps, Tags } from "aws-cdk-lib";
import { StackCheckingAspect } from "@digitraffic/common/dist/aws/infra/stack/stack-checking-aspect";
import { SOLUTION_KEY, DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import {Open311Props} from "./app-props";

export class Open311Stack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: Open311Props) {
        super(scope, id, configuration);

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        const vpc = ec2.Vpc.fromVpcAttributes(this, "vpc", {
            vpcId: configuration.vpcId,
            privateSubnetIds: configuration.privateSubnetIds,
            availabilityZones: configuration.availabilityZones
        });
        // security group that allows Lambda database access
        const lambdaDbSg = ec2.SecurityGroup.fromSecurityGroupId(
            this,
            "LambdaDbSG",
            configuration.lambdaDbSgId
        );

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        IntegrationApi.create(vpc, lambdaDbSg, this, configuration);
        PublicApi.create(vpc, lambdaDbSg, this, configuration);
        InternalLambdas.create(vpc, lambdaDbSg, this, configuration);

        Tags.of(this).add(SOLUTION_KEY, "Open311");
        Aspects.of(this).add(new StackCheckingAspect());
    }
}
