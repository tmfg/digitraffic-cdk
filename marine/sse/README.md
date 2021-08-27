# Digitraffic Road - Maintenance tracking integration

Sea State Estimation (SSE) integration receives POST-request with SSE JSON. Lambda read and saves individual sites data in db.
Data is then readable from marine-web -application public api.

## Run build

    yarn run build
    yarn run all-watch
    yarn run test

## Deploy to AWS

* Show changes
    * `yarn run cdk-diff-test` or 
    * `yarn run cdk-diff-prod` 
* Deploy
    * `yarn run cdk-deploy-test` or 
    * `yarn run cdk-deploy-prod`