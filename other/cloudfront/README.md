How to install?

What you need before installing?

1. Domain name
2. AWS Certificate for that domain name(this must be in us-east-1 region)
3. Set AWS_PROFILE-env variable
4. Configuration props for that profile
5. Log in to aws from command line

Build

    rushx build

Now you can deploy cloudfront with:

    rushx cdk deploy

There is also commands like

    rushx cdk-diff-marine-test
    rushx cdk-diff-marine-prod
    rushx cdk-diff-road-test
    rushx cdk-diff-road-prod

    rushx cdk-deploy-marine-test
    rushx cdk-deploy-marine-prod
    rushx cdk-deploy-road-test
    rushx cdk-deploy-road-prod

And after that?

1. Check weathercam-bucket, you must give permission to created
   originAccessIdentity
2. Route53, domain-names should be alias to created cloudfront distributions
