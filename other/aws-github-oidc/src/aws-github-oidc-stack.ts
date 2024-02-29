import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import { type Construct } from "constructs";
import {
    Effect,
    OpenIdConnectProvider,
    PolicyStatement,
    Role,
    WebIdentityPrincipal
} from "aws-cdk-lib/aws-iam";
import { Function } from "aws-cdk-lib/aws-lambda";
import { type TrafficType } from "@digitraffic/common/dist/types/traffictype";

export interface AwsGithubProps {
    readonly roles: {
        readonly updateSwaggerForTrafficType?: TrafficType;
        readonly shortName: string;
        readonly repo: string;
        readonly environment: string;
        readonly allowedActions: string[];
    }[];
}

export class AwsGithubOidcStack extends Stack {
    constructor(scope: Construct, id: string, props: AwsGithubProps, stackProps: StackProps) {
        super(scope, id, stackProps);

        new OpenIdConnectProvider(this, "GitHubOIDCProvider", {
            url: "https://token.actions.githubusercontent.com",
            clientIds: ["sts.amazonaws.com"],
            thumbprints: [
                "a031c46782e6e6c662c2c87c76da9aa62ccabd8e",
                "6938fd4d98bab03faadb97b34396831e3780aea1"
            ]
        });

        props.roles.forEach((role) => {
            const envCapitalized = role.environment.replace(/^\w/, (c) => c.toUpperCase());
            const createdRole = new Role(this, `${role.shortName}-OIDCRole`, {
                assumedBy: new WebIdentityPrincipal(
                    `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
                    {
                        StringLike: {
                            "token.actions.githubusercontent.com:sub": `repo:tmfg/${role.repo}:environment:${role.environment}`
                        }
                    }
                ),
                roleName: `${role.shortName}-GitHub-OIDC-Role`,
                description: `Used by GitHub Actions to perform ${role.shortName} related actions in this account`,
                maxSessionDuration: Duration.hours(1)
            });
            if (role.allowedActions.length) {
                createdRole.addToPrincipalPolicy(
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: role.allowedActions,
                        resources: ["*"]
                    })
                );
            }
            if (role.updateSwaggerForTrafficType) {
                const updateApiDocsFunctionName = `SwaggerJoiner${role.updateSwaggerForTrafficType}${envCapitalized}-UpdateApiDocumentation`;
                const updateSwaggerDocsFunctionName = `SwaggerJoiner${role.updateSwaggerForTrafficType}${envCapitalized}-UpdateSwaggerDescriptions`;
                createdRole.addToPrincipalPolicy(
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ["lambda:InvokeFunction"],
                        resources: [
                            Function.fromFunctionName(
                                this,
                                updateApiDocsFunctionName,
                                updateApiDocsFunctionName
                            ).functionArn,
                            Function.fromFunctionName(
                                this,
                                updateSwaggerDocsFunctionName,
                                updateSwaggerDocsFunctionName
                            ).functionArn
                        ]
                    })
                );
            }
        });
    }
}
