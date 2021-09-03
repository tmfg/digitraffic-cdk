import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics";
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Role} from "@aws-cdk/aws-iam";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {CfnCanary} from "@aws-cdk/aws-synthetics";

import {CanaryParameters} from "./canary-parameters";
import {LambdaEnvironment} from "../model/lambda-environment";
import {CanaryAlarm} from "./canary-alarm";

export class DbTestCanary extends Construct {
    constructor(scope: Construct,
                secret: ISecret,
                role: Role,
                vpc: IVpc,
                lambdaDbSg: ISecurityGroup,
                params: CanaryParameters) {
        super(scope, params.name);

        const canaryName = `${params.name}-db`;
        const environmentVariables: LambdaEnvironment = {};
        environmentVariables.secret = params.secret as string;

        // the handler code is defined at the actual project using this
        const canary = new Canary(scope, canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_1,
            role,
            test: Test.custom({
                code: new AssetCode("dist"),
                handler: `${params.handler ?? 'db-test'}.handler`,
            }),
            environmentVariables,
            canaryName,
            schedule: Schedule.rate(params.rate ?? Duration.minutes(15))
        });

        secret.grantRead(canary.role);
        canary.artifactsBucket.grantWrite(role);

        // need to override vpc and security group, can't do this with cdk
        const cfnCanary = canary.node.defaultChild as CfnCanary;

        const subnetIds = vpc.privateSubnets.map(subnet => subnet.subnetId);

        cfnCanary.vpcConfig = {
            vpcId: vpc.vpcId,
            securityGroupIds: [lambdaDbSg.securityGroupId],
            subnetIds: subnetIds
        };

        if(params.alarm ?? true) {
            new CanaryAlarm(scope, canary, params);
        }

        return canary;
    }
}