import { Role } from "aws-cdk-lib/aws-iam";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { CfnCanary } from "aws-cdk-lib/aws-synthetics";
import { Schedule } from "aws-cdk-lib/aws-events";
import { Duration } from "aws-cdk-lib";

import type { CanaryParameters } from "./canary-parameters.js";
import { DigitrafficCanary } from "./canary.js";
import { DigitrafficStack } from "../stack/stack.js";

export class DatabaseCanary extends DigitrafficCanary {
    constructor(stack: DigitrafficStack, role: Role, secret: ISecret, params: CanaryParameters) {
        const canaryName = `${params.name}-db`;
        const environmentVariables = stack.createDefaultLambdaEnvironment(`Synthetics-${canaryName}`);

        // the handler code is defined at the actual project using this
        super(stack, canaryName, role, params, environmentVariables);

        this.artifactsBucket.grantWrite(this.role);
        secret.grantRead(this.role);

        // need to override vpc and security group, can't do this with cdk
        if (this.node.defaultChild instanceof CfnCanary) {
            const subnetIds =
                stack.vpc === undefined ? [] : stack.vpc.privateSubnets.map((subnet) => subnet.subnetId);

            const securityGroupIds = stack.lambdaDbSg === undefined ? [] : [stack.lambdaDbSg.securityGroupId];

            this.node.defaultChild.vpcConfig = {
                vpcId: stack.vpc?.vpcId,
                securityGroupIds,
                subnetIds,
            };
        }
    }

    static create(stack: DigitrafficStack, role: Role, params: CanaryParameters): DatabaseCanary {
        const secret = stack.getSecret();
        return new DatabaseCanary(stack, role, secret, {
            ...{
                secret: stack.configuration.secretId,
                schedule: Schedule.rate(Duration.hours(1)),
                handler: `${params.name}.handler`,
            },
            ...params,
        });
    }

    /**
     *
     * @param stack
     * @param role
     * @param name name of the typescipt file without -db -suffix. Max len is 10 char if @param canaryName is not given.
     * @param params
     * @param canaryName Optional name for canary if multiple canaries is made from same ${name}-db.ts canary file.
     */
    static createV2(
        stack: DigitrafficStack,
        role: Role,
        name: string,
        params: Partial<CanaryParameters> = {},
        canaryName = name,
    ): DatabaseCanary {
        const secret = stack.getSecret();
        return new DatabaseCanary(stack, role, secret, {
            ...{
                secret: stack.configuration.secretId,
                schedule: Schedule.rate(Duration.hours(1)),
                handler: `${name}-db.handler`,
                name: canaryName,
                alarm: {
                    alarmName:
                        canaryName === name
                            ? `${stack.configuration.shortName}-DB-Alarm`
                            : `${canaryName}-DB-Alarm`,
                    topicArn: stack.configuration.alarmTopicArn,
                },
            },
            ...params,
        });
    }
}
