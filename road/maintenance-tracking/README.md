# Digitraffic Road - Maintenance tracking integration

Maintenance tracking integration receives POST-request with tracking JSON, puts it in AWS SQS Queue and saves it to db from there. 
Road application then reads saved data from the db and combines the contents of the messages for sharing it from the public API as trackings.

# Build

* Install dependencies 
    * `npm install` 
* Build project
    * `npm run build`
* Run tests
    * In order to run tests you need to set up the local database from the [digitraffic-road project](https://github.com/tmfg/digitraffic-road/tree/develop/dbroad).
    * `npm run test` 

# Installation

## Setup env

* Sets AWS environment variables to road test/prod.
    * `. ../cdk-set-env-road-test.sh` or 
    * `. ../cdk-set-env-road-prod.sh`
* Init mfa session
    * `~/.aws/bin/digitraffic_mfa_aws.sh <mfa-token>`  

## Deploy to AWS

* Show changes
    * `cdk diff MaintenanceTrackingRoadTest` or 
    * `cdk diff MaintenanceTrackingRoadProd` 
* Deploy
    * `cdk deploy MaintenanceTrackingRoadTest` or 
    * `cdk deploy MaintenanceTrackingRoadProd`
* Synthesize a CloudFormation template for local inspection (not required)
    * `cdk synth MaintenanceTrackingRoadTest --no-staging > template.yaml` or
    * `cdk synth MaintenanceTrackingRoadProd --no-staging > template.yaml` 

# Misc

## Send message to integration api

* Got to scripts directory
    * `cd test/scripts/`
* Run script to post tracking json -message
    * `./post-to-apigateway-lambda.sh <lambda-base-url|integration-url> <api-key-value> <path/to/message.json>`

## Message count in

Maximum count of messages in has been around 4000/5min -> 4000/5/60 = 14/s.
Normally about 5000 msg/h -> 83 msg/min.