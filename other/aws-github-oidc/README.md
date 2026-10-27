# AWS GitHub OIDC

Creates a role assumable by GitHub Actions and an OIDC trust relationship to the
GitHub repository/environment. This stack should be deployed to all AWS accounts
associated with GitHub Actions.

## Setup

```
rush install            # in repository root
cd other/aws-github-oidc
rushx build
rushx test
```

`src/bin/` must contain:

| File | Exports |
|---|---|
| `aws-github-oidc-app.ts` | CDK app with all `AwsGithubOidc<Domain><Env>` stacks |
| `config-afir.ts` | `AfirTestAccount`, `AfirProdAccount` |
| `config-marine.ts` | `MarineTestAccount`, `MarineProdAccount` |
| `config-parking.ts` | `ParkingTestAccount`, `ParkingProdAccount` |
| `config-rail.ts` | `RailTestAccount`, `RailProdAccount` |
| `config-road.ts` | `RoadTestAccount`, `RoadProdAccount` |

Each account export is a stack props object:

```ts
export const MarineTestAccount = {
  env: { account: "<account-id>", region: "eu-west-1" },
};
```

## Diff and deploy

Scripts are named `cdk-<diff|deploy>-<domain>-<test|prod>`. Domains: `afir`,
`catalog`, `marine`, `parking`, `rail`, `road` and `status`. Each script
builds the project and deploys the matching `AwsGithubOidc<Domain><Env>` stack.

```
rushx cdk-diff-<domain>-<test|prod>
rushx cdk-deploy-<domain>-<test|prod>
```

## GitHub Actions secrets

Roles are named `<shortName>-GitHub-OIDC-Role`. After deploying a stack, add the
role ARN as a secret to the matching GitHub environment (`test` / `prod`)
of the repository that uses it.

For example, for the Swagger role:

```
aws iam get-role --role-name Swagger-GitHub-OIDC-Role \
  --query Role.Arn --output text --profile <aws-profile>
```

Add the ARN as the `AWS_SWAGGER_ROLE` secret: GitHub repository → Settings →
Environments → `<environment>` → Environment secrets. Or with the GitHub CLI:

```
gh secret set AWS_SWAGGER_ROLE --env <environment> --repo tmfg/<repo> --body "<role-arn>"
```

## Adding a Swagger role for a domain

The repository's `update-swagger.yml` workflow assumes `AWS_SWAGGER_ROLE` and
invokes the `SwaggerJoiner<Domain><Env>-*` lambdas.

1. Add a role with `shortName: "Swagger"` and `updateSwaggerForTrafficType` to
   the domain's test and prod stacks in `src/bin/aws-github-oidc-app.ts`.
2. Diff and deploy the stacks, see above.
3. Set the `AWS_SWAGGER_ROLE` secret per environment with the ARN of the
   account's `Swagger-GitHub-OIDC-Role`. Test and prod accounts have
   different ARNs.

## Troubleshooting

`Not authorized to perform sts:AssumeRoleWithWebIdentity` usually means that
the role does not exist in the account, or the secret contains a wrong ARN.
Check that the role exists and that the secret value matches its ARN. The
role's trust policy only allows the GitHub environment given in `environment`
(`repo:tmfg/<repo>:environment:<environment>`).
