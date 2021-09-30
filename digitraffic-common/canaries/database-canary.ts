import {Role} from "@aws-cdk/aws-iam";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {CfnCanary} from "@aws-cdk/aws-synthetics";

import {CanaryParameters} from "./canary-parameters";
import {LambdaEnvironment} from "../model/lambda-environment";
import {DigitrafficCanary} from "./canary";
import {DigitrafficStack} from "../stack/stack";

export class DatabaseCanary extends DigitrafficCanary {
    constructor(stack: DigitrafficStack,
                role: Role,
                secret: ISecret,
                params: CanaryParameters) {
        const canaryName = `${params.name}-db`;
        const environmentVariables: LambdaEnvironment = {};
        environmentVariables.secret = params.secret as string;

        // the handler code is defined at the actual project using this
        super(stack, canaryName, role, params, environmentVariables);

        this.artifactsBucket.grantWrite(this.role);
        secret.grantRead(this.role);

        // need to override vpc and security group, can't do this with cdk
        const cfnCanary = this.node.defaultChild as CfnCanary;

        const subnetIds = stack.vpc.privateSubnets.map(subnet => subnet.subnetId);

        cfnCanary.vpcConfig = {
            vpcId: stack.vpc.vpcId,
            securityGroupIds: [stack.lambdaDbSg.securityGroupId],
            subnetIds: subnetIds
        };
    }
}
