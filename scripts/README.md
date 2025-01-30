# Scripts to do copy configs, diff and deploy for CDK-projects

# cdk-diff

1. copy `cdk-set-env.sh.templat`to `cdk-set-env.sh`
1. Update `AWS_DEFAULT_REGION` variable and `AWS_PROFILE` values.
1. Go to you project ie. `marine/sse`
1. Run
   - Diff: `../../scripts/cdk-diff-and-deploy.sh marine-test diff`
   - Deploy `../../scripts/cdk-diff-and-deploy.sh marine-test deploy`

# Copy marine or road common config

copy `copy-transport-type-config.sh.template`to `copy-transport-type-config.sh`

1. Update `CDK_CONFIG_DIR` variable value to point to directory with ckd ci
   -properties.
1. Go to you transport type or project dir ie. `marine`or `marine/sse`
1. Run
   - Copy config from ci to cdk: `../../scripts/copy-common-config.sh from-ci`
   - Copy config from cdk to ci: `../../scripts/copy-common-config.sh to-ci`

# Copy project config

copy `copy-app-config.sh.template`to `copy-app-config.sh`

1. Update `CDK_CONFIG_DIR` variable value to point to directory with ckd ci
   -properties.
1. Go to you project dir ie. `marine/sse`
1. Run
   - Copy config from ci to cdk: `../../scripts/copy-app-config.sh from-ci`
   - Copy config from cdk to ci: `../../scripts/copy-app-config.sh to-ci`
