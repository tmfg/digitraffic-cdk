How to install?

What you need before installing?

1. Domain name
2. AWS Certificate for that domain name(this must be in us-east-1 region)
3. Set AWS_PROFILE-env variable
4. Configuration props for that profile
5. Log in to aws from command line

Build

    pnpm run build

Now you can deploy cloudfrontrun with:

    pnpm dlx cdk@latest deploy

There is also commands like

    pnpm run cdk-diff-marine-test
    pnpm run cdk-diff-marine-prod
    pnpm run cdk-diff-road-test
    pnpm run cdk-diff-road-prod

    pnpm run cdk-deploy-marine-test
    pnpm run cdk-deploy-marine-prod
    pnpm run cdk-deploy-road-test
    pnpm run cdk-deploy-road-prod

And after that?

1. Check weathercam-bucket, you must give permission to created originAccessIdentity
2. Route53, domain-names should be alias to created cloudfront distributions
