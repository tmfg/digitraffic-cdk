# Digitraffic Road - Maintenance tracking integration

Maintenance tracking integration receives POST-request with tracking JSON, puts it in AWS SQS Queue and saves it to db from there. 
Road application then reads saved data from the db and combines the contents of the messages for sharing it from the public API as trackings.

## Run build

    `yarn run build`
    `yarn run all-watch`
    `yarn run test`

## Deploy to AWS

* Show changes
    * `./cdk-diff.sh test` or 
    * `./cdk-diff.sh prod` 
* Deploy
    * `./cdk-deploy.sh test` or 
    * `./cdk-deploy.sh prod`
* Synthesize a CloudFormation template for local inspection (not required)
    * `./cdk-synth.sh test` or
    * `./cdk-synth.sh prod` 
