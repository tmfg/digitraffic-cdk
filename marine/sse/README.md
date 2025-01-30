# Digitraffic Road - Maintenance tracking integration

Sea State Estimation (SSE) integration receives POST-request with SSE JSON.
Lambda read and saves individual sites data in db. Data is then readable from
marine-web -application public api.

## Run build

    pnpm run build
    pnpm run all-watch
    pnpm run test

## Deploy to AWS

- Show changes
  - `pnpm run cdk-diff-test` or
  - `pnpm run cdk-diff-prod`
- Deploy
  - `pnpm run cdk-deploy-test` or
  - `pnpm run cdk-deploy-prod`
