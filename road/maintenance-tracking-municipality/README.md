# Digitraffic Road - Maintenance tracking integration for municipality data

Maintenance tracking municipality integration fetches data from different domains and saves data to db. Data is then .

## Run build

    `pnpm run build`
    `pnpm run all-watch`
    `pnpm run test`

## Deploy to AWS

-   Show changes
    -   `pnpm run cdk-diff-road-test` or
    -   `pnpm run cdk-diff-road-prod`
-   Deploy
    -   `pnpm run cdk-deploy-road-test` or
    -   `pnpm run cdk-deploy-road-prod`
-
-   Synthesize a CloudFormation template for local inspection (not required)
    -   `pnpm run cdk-synth-road-test` or
    -   `pnpm run cdk-synth-road-prod`
