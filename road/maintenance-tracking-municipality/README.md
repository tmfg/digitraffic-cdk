# Digitraffic Road - Maintenance tracking integration for municipality data

Maintenance tracking municipality integration fetches data from sources and saves data to db.

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

# Misc

## Send message to integration api

* Got to scripts directory
    * `cd test/scripts/`
* Run script to post tracking json -message
    * `./post-to-apigateway-lambda.sh <lambda-base-url|integration-url> <api-key-value> <path/to/message.json>`

## Message count in

Maximum count of messages in has been around 4000/5min -> 4000/5/60 = 14/s.
Normally about 5000 msg/h -> 83 msg/min.