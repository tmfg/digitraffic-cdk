import {Construct} from "@aws-cdk/core";
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Role} from "@aws-cdk/aws-iam";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {CfnCanary} from "@aws-cdk/aws-synthetics";

import {CanaryParameters} from "./canary-parameters";
import {LambdaEnvironment} from "../model/lambda-environment";
import {CanaryAlarm} from "./canary-alarm";
import {createCanary, DigitrafficCanary} from "./canary";

export class DatabaseCanary extends DigitrafficCanary {
    constructor(scope: Construct,
                role: Role,
                secret: ISecret,
                vpc: IVpc,
                lambdaDbSg: ISecurityGroup,
                params: CanaryParameters) {
        const canaryName = `${params.name}-db`;
        const environmentVariables: LambdaEnvironment = {};
        environmentVariables.secret = params.secret as string;

        // the handler code is defined at the actual project using this
        super(scope, canaryName, role, params, environmentVariables);

        this.artifactsBucket.grantWrite(this.role);
        secret.grantRead(this.role);

        // need to override vpc and security group, can't do this with cdk
        const cfnCanary = this.node.defaultChild as CfnCanary;

        const subnetIds = vpc.privateSubnets.map(subnet => subnet.subnetId);

        cfnCanary.vpcConfig = {
            vpcId: vpc.vpcId,
            securityGroupIds: [lambdaDbSg.securityGroupId],
            subnetIds: subnetIds
        };
    }
}
