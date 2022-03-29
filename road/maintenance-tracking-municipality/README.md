# Digitraffic Road - Maintenance tracking integration for municipality data

Maintenance tracking municipality integration fetches data from different domains and saves data to db. Data is then .

## Run build

    `yarn run build`
    `yarn run all-watch`
    `yarn run test`

## Deploy to AWS

* Show changes
    * `yarn run cdk-diff-road-test` or 
    * `yarn run cdk-diff-road-prod` 
* Deploy
    * `yarn run cdk-deploy-road-test` or 
    * `yarn run cdk-deploy-road-prod`
* 
* Synthesize a CloudFormation template for local inspection (not required)
    * `yarn run cdk-synth-road-test` or
    * `yarn run cdk-synth-road-prod` 
