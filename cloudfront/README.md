How to install?

What you need before installing?
1. Domain name
2. AWS Certificate for that domain name(this must be in us-east-1 region)
3. Set AWS_PROFILE-env variable
4. Configuration props for that profile
5. Log in to aws from command line

Now you can deploy cloudfront with:

cdk deploy

And after that?
1. Check weathercam-bucket, you must give permission to created originAccessIdentity
2. Route53, domain-names should be alias to created cloudfront distributions


# CloudFront

# Build

* Install dependencies 
    * `npm install` 
* Build project
    * `npm run build`

# Installation

## Setup env

* Sets AWS environment variables to road test/prod.
    * `. ../road/cdk-set-env-road-test.sh` or 
    * `. ../road/cdk-set-env-road-prod.sh` or
    * `. ../marine/cdk-set-env-marine-test.sh` or
    * `. ../marine/cdk-set-env-marine-prod.sh`
* Init mfa session
    * `~/.aws/bin/digitraffic_mfa_aws.sh <mfa-token>`  

## Deploy to AWS

* Show changes
    * `cdk diff CloudfrontRoadTest` or 
    * `cdk diff CloudfrontRoadProd` or
    * `cdk diff CloudfrontMarineTest` or 
    * `cdk diff CloudfrontMarinePod` 
* Deploy
    * `cdk deploy CloudfrontRoadTest` or 
    * `cdk deploy CloudfrontRoadProd` or
    * `cdk deploy CloudfrontMarineTest` or 
    * `cdk deploy CloudfrontMarinePod` 
* Synthesize a CloudFormation template for local inspection (not required)
    * `cdk synth CloudfrontRoadTest --no-staging > template.yaml` or
    * `cdk synth CloudfrontRoadProd --no-staging > template.yaml` or
    * `cdk synth CloudfrontMarineTest --no-staging > template.yaml` or
    * `cdk synth CloudfrontMarinePod --no-staging > template.yaml` 
