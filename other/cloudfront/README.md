# How to install?

## What you need before installing?

1. Domain name
2. AWS Certificate for that domain name(this must be in us-east-1 region)
3. Set AWS_PROFILE-env variable
4. Configuration props for that profile
5. Log in to aws from command line

## Build and test

    rushx build
    rushx test

Before deploying, also run the CloudFront Function runtime check against a
test account (it calls the real AWS CloudFront JS runtime, and catches syntax
it rejects even when Node/Vitest accept it fine). It only runs via
`rushx test:runtime`, never via plain `rushx test` (or `rushx ci:test`, which
CI uses), and refuses to run unless your profile name contains `-tst` or
`-test`. There is no separate flag to skip it: just use `rushx test` instead.

    AWS_PROFILE=profile-name rushx test:runtime

### Runtime test freshness reminder

A successful `rushx test:runtime` writes a timestamp to `dist/.runtime-test-last-run`
(only when run with an AWS profile). Every `cdk-deploy-*` command first runs
`scripts/check-runtime-test-freshness.js`, which reads that timestamp and prints
a warning if the runtime test has never been run or was last run over 6 hours ago.

The reminder never blocks the deploy; it only warns. If you see the warning, run
`AWS_PROFILE=profile-name rushx test:runtime` with a test account profile (see
above), then deploy again. `cdk-diff-*` commands do not run the reminder.

## Deploy

Use the per-environment `cdk-deploy-*` commands below; they run the runtime test
freshness reminder first. The generic `rushx cdk deploy` bypasses that reminder,
so prefer it only for one-off ad-hoc stacks, not for road/marine/rail/afir.

Each command uses a fixed AWS profile (see `scripts/cdk-env.conf`), and a stack
is created only when the profile matches its environment. Rail creates
`CloudfrontRailTest` only with a `-rail-tst` profile and `CloudfrontRailProd`
only with a `-rail-prd` profile.

    rushx cdk-diff-road-test
    rushx cdk-diff-road-prod
    rushx cdk-deploy-road-test
    rushx cdk-deploy-road-prod

    rushx cdk-diff-marine-test
    rushx cdk-diff-marine-prod
    rushx cdk-deploy-marine-test
    rushx cdk-deploy-marine-prod

    rushx cdk-diff-rail-test
    rushx cdk-diff-rail-prod
    rushx cdk-deploy-rail-test
    rushx cdk-deploy-rail-prod

    rushx cdk-diff-afir-test    
    rushx cdk-diff-afir-prod
    rushx cdk-deploy-afir-test    
    rushx cdk-deploy-afir-prod

## After that?

1. Check weathercam-bucket, you must give permission to created
   originAccessIdentity
2. Route53, domain-names should be alias to created cloudfront distributions

