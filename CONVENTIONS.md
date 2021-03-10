# Conventions

# Dependencies
Use the caret ^ semver syntax to allow updates of minor and patch versions if possible, otherwise lock the dependency version.

## Naming conventions
The CI server expects your app to follow these conventions. 
- stack configuration goes under bin/ named after the app directory plus -app.ts, e.g. swagger-joiner.app.ts
- stacks are named after your app in camelcase plus app name and environment, e.g. SwaggerJoinerSomethingTest
- use the env properties to specify the account id and region https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html
