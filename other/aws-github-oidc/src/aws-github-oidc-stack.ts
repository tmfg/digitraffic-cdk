import type { TrafficType } from "@digitraffic/common/dist/types/traffictype";
import type { StackProps } from "aws-cdk-lib";
import { Duration, Stack } from "aws-cdk-lib";
import {
  Effect,
  OpenIdConnectProvider,
  PolicyStatement,
  Role,
  WebIdentityPrincipal,
} from "aws-cdk-lib/aws-iam";
import { Function as AwsFunction } from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";

export interface AwsGithubProps {
  readonly roles: {
    readonly updateSwaggerForTrafficType?: TrafficType;
    readonly shortName: string;
    readonly repo: string;
    readonly environment?: string; // if missing, applies to all environments
    readonly allowedActions: string[];
    readonly additionalPolicies?: PolicyStatement[];
  }[];
}

function createStringLikeCondition(
  repo: string,
  environment?: string,
): { [key: string]: string } {
  if (environment) {
    return {
      "token.actions.githubusercontent.com:sub": `repo:tmfg/${repo}:environment:${environment}`,
    };
  }

  return {
    "token.actions.githubusercontent.com:sub": `repo:tmfg/${repo}:*`,
  };
}

export class AwsGithubOidcStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: AwsGithubProps,
    stackProps: StackProps,
  ) {
    super(scope, id, stackProps);

    new OpenIdConnectProvider(this, "GitHubOIDCProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
      thumbprints: [
        "a031c46782e6e6c662c2c87c76da9aa62ccabd8e",
        "6938fd4d98bab03faadb97b34396831e3780aea1",
      ],
    });

    props.roles.forEach((role) => {
      const createdRole = new Role(this, `${role.shortName}-OIDCRole`, {
        assumedBy: new WebIdentityPrincipal(
          `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
          {
            StringLike: createStringLikeCondition(role.repo, role.environment),
          },
        ),
        roleName: `${role.shortName}-GitHub-OIDC-Role`,
        description: `Used by GitHub Actions to perform ${role.shortName} related actions in this account`,
        maxSessionDuration: Duration.hours(1),
      });
      if (role.allowedActions.length) {
        createdRole.addToPrincipalPolicy(
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: role.allowedActions,
            resources: ["*"],
          }),
        );
      }
      if (role.additionalPolicies) {
        role.additionalPolicies.forEach((policy) => {
          createdRole.addToPrincipalPolicy(policy);
        });
      }
      if (role.updateSwaggerForTrafficType) {
        const envCapitalized = role.environment?.replace(/^\w/, (c) =>
          c.toUpperCase(),
        );
        const updateApiDocsFunctionName = `SwaggerJoiner${role.updateSwaggerForTrafficType}${envCapitalized}-UpdateApiDocumentation`;
        const updateSwaggerDocsFunctionName = `SwaggerJoiner${role.updateSwaggerForTrafficType}${envCapitalized}-UpdateSwaggerDescriptions`;
        createdRole.addToPrincipalPolicy(
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["lambda:InvokeFunction"],
            resources: [
              AwsFunction.fromFunctionName(
                this,
                updateApiDocsFunctionName,
                updateApiDocsFunctionName,
              ).functionArn,
              AwsFunction.fromFunctionName(
                this,
                updateSwaggerDocsFunctionName,
                updateSwaggerDocsFunctionName,
              ).functionArn,
            ],
          }),
        );
      }
    });
  }
}
