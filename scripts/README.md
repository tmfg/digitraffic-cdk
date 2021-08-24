# Scripts to do diff and deploy for CDK-projects

1. copy `cdk-set-env.sh.templat`to `cdk-set-env.sh`
1. Update `AWS_DEFAULT_REGION` variable and `AWS_PROFILE` values.
1. Go to you project ie. `marine/sse`
1. Run 
    * Diff: `../../scripts/cdk-diff-and-deploy.sh marine-test diff`
    * Deploy `../../scripts/cdk-diff-and-deploy.sh marine-test deploy`
