import { DigitrafficStack, SOLUTION_KEY } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { StackCheckingAspect } from "@digitraffic/common/dist/aws/infra/stack/stack-checking-aspect";
import { Aspects, Tags } from "aws-cdk-lib";
import type { Construct } from "constructs";
import type { Open311Props } from "./app-props.js";
import * as IntegrationApi from "./integration-api.js";
import * as InternalLambdas from "./internal-lambdas.js";
import * as PublicApi from "./public-api.js";

export class Open311Stack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: Open311Props) {
        super(scope, id, configuration);

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        /*const vpc = ec2.Vpc.fromVpcAttributes(this, "vpc", {
            vpcId: configuration.vpcId,
            privateSubnetIds: configuration.privateSubnetIds,
            availabilityZones: configuration.availabilityZones
        });*/
        // security group that allows Lambda database access
        /*const lambdaDbSg = ec2.SecurityGroup.fromSecurityGroupId(
            this,
            "LambdaDbSG",
            configuration.lambdaDbSgId
        );*/

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        IntegrationApi.create(this, configuration);
        PublicApi.create(this, configuration);
        InternalLambdas.create(this);

        Tags.of(this).add(SOLUTION_KEY, "Open311");
        Aspects.of(this).add(new StackCheckingAspect());
    }
}
