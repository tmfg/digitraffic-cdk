# digitraffic-cdk

Digitraffic AWS CDK stacks.

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

## Useful commands

 * `npm run build`                          compile typescript to js
 * `npm run watch`                          watch for changes and compile
 * `npm run test`                           perform the jest unit tests
 * `cdk deploy`                             deploy this stack to your default AWS account/region
 * `cdk diff`                               compare deployed stack with current state
 * `cdk synth`                              emits the synthesized CloudFormation template
 * `cdk synth --no-staging > template.yaml` emits a CloudFormation template suitable for invoking a SAM Lambda function locally