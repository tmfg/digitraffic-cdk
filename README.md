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
|   └───foo-schema.ts
|
└───service
|   └───service-foos.ts
|
└───some-cdk-stack.ts
|
test
│
└───lambda
    └───update-foos.test.ts

```
- separate source code to their own directories by category (API operations, database queries etc)
- Lambdas are in their own directory to facilitate bundling (lambda.AssetCode)
- document implicit dependencies, e.g. to run tests, use database from digitraffic-road/dbroad 

## Naming conventions
The CI server expects your app to follow these conventions. 
- stack configuration goes under bin/ named after the app directory plus -app.ts, e.g. swagger-joiner.app.ts
- stacks are named after your app in camelcase plus app name and environment, e.g. SwaggerJoinerRoadTest
- use the env properties to specify the account id and region https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html

## Starting a new CDK-project

If some of the old projects seems like a good start for the new project run command:

    ./init-cdk-project-from-project.sh  <project-to-clone> <new-project-name>
    # For example: 
    ./init-cdk-project-from-project.sh marine/portcall-estimates/ road/maintenance-tracking/

This copies contents from the existing project and does some replacements for the names.

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
 
## Checking dependencies
 * https://www.npmjs.com/package/npm-check
 * `npm install -g npm-check` Install npm-check globally to check for outdated, incorrect, and unused dependencies.
 * `npm-check` Run under project directory to check outdated, incorrect, and unused dependencies.