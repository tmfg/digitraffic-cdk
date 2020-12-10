# Maintenance tracking log watcher

Read logs from elastic search and combines erroneous maintenance trackings as file to S3 and sends them as email.  

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

* Init mfa session
    * `~/.aws/bin/digitraffic_mfa_aws.sh <mfa-token>`  

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


