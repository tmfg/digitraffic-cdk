# digitraffic-cdk

Digitraffic AWS CDK apps.

## Suggested architecture
```
bin
└───some-cdk.ts
|   dont-commit-this-props-some-environment.ts
│
lib
│
└───api
|   └───api-foos.ts
|
└───db
|   └───db-foos.ts
|
└───lambda
|   └───update-foos
|       └───lambda-update-foos.ts
|
└───model
|   └───foo.ts
|
└───some-cdk-stack.ts
```
- separate source code to their own directories by category (API operations, database queries etc)
- Lambdas are in their own directory to facilitate bundling (lambda.AssetCode)
- properties files under *bin* are loaded by active AWS_PROFILE env variable, e.g. file above loads when using profile *some-environment* 

## Development workflow (in a cdk directory, e.g. open311-cdk)

### npm scripts
* `npm install` Run this first, and only after making changes to package.json
* `npm run watch` Run this while developing. This compiles TypeScript files on change
* `npm run test ` Execute tests after making changes to make sure you don't break anything
* `npm run build` This compiles TypeScript and also bundles Lambdas under `dist/lambdas`

### cdk scripts
 * `cdk deploy` Deploys this stack to your AWS_PROFILE account
 * `cdk diff` Compare your current stack to the deployed stack
 * `cdk synth > template.yaml` Emits a CloudFormation template
 * `cdk synth --no-staging > template.yaml` Emits a CloudFormation template suitable for invoking a SAM Lambda function locally via `sam local invoke DoStuffLambda123 --event event.json --env-vars env.json` (check the Lambda name from template.yaml)