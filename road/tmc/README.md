# TMC

Publishes the TMC/ALERT-C location table datasets at
[tie.digitraffic.fi/tmc/](https://tie.digitraffic.fi/tmc/).

## Structure

The stack imports the existing `tmc-road-<env>` bucket — it never creates or deletes it. The
bucket predates this stack and was originally managed by CloudFormation
(`digitraffic-ci-internal/aws/cloudformation/digitraffic-cloudformation.yml`) with
`DeletionPolicy: Retain`, so it and its policy survived when that management ended. CloudFront
serves both the listing page and the datasets under the `tmc/*` behaviour of the road
distribution; that behaviour is configured in
`digitraffic-ci-internal/aws/cdk/other/cloudfront/cloudfront-road.ts`.

```
tmc-road-<env>/
├── index.html, assets/    site, deployed by this stack
├── certified/             certified dataset releases
├── noncertified/          non-certified dataset releases
└── ...                    licence text and reference zip packages at the bucket root
```

Every object under the bucket root except the site files above is real, permanent TMC data and
must never be deleted by this stack or its deployment. `BucketDeployment` uses `prune: false` and
only ever writes the listing page's own files, so it can never touch anything else.

## Maintenance

The stack manages the website and bucket policy for the existing bucket. Re-running the stack is
non-destructive: `BucketDeployment` uses `prune: false` and deploys only the listing page files,
so the certified and non-certified datasets and the other root-level objects remain untouched.

The bucket policy is managed unconditionally by this stack. Keep policy changes in the CDK stack
so the CloudFront access rules remain consistent with the deployed infrastructure.

## Inspecting bucket contents

List every object in the bucket, including nested dataset folders:

```bash
export AWS_PROFILE=<aws-profile>
aws s3 ls s3://<bucket-name>/ --recursive --human-readable --summarize
```

Use the environment-specific bucket name and AWS profile from the private deployment
configuration; keep them as placeholders in documentation and commands you share.

## Listing page

The page itself lives in the shared [other/s3-listing-website](../../other/s3-listing-website)
package, not in this project — see that package's README for how the engine works and how to
develop it. This project only supplies its own `basePath`, title/intro text and mock data via
`createListingWebsiteSources(...)` in `tmc-stack.ts`.

The page lists the bucket contents live through `ListObjectsV2`
(`/tmc/?list-type=2&delimiter=/&prefix=...`). Available in Finnish and English via the hash query
parameter `lang=fi|en`. The browser location uses the hash for the current folder and a hash
query parameter for the page and language, so a shareable English link to `certified/` is:

```text
/tmc/#/certified/?lang=en
```

### Local preview

```bash
rushx serve:website:local
```

runs the shared package's preview script against this project's own
[local-preview.config.json](local-preview.config.json) (mirrors the config passed to
`createListingWebsiteSources` in the stack, but is only used locally and never deployed). Open
`http://localhost:8080/?mock=1` to see the mock listing (a plain `http://localhost:8080/` tries
the real S3 REST API, which doesn't exist locally, and shows an error — that's expected).
For English: `http://localhost:8080/?mock=1&lang=en`.

### Developing the listing page itself

For changes to the shared engine (`index.html` or `assets/*`), use the local preview command above.
For changes to `createListingWebsiteSources` in `other/s3-listing-website/src/index.ts`, use the
build command in the next section; it builds the shared package as a dependency.

### Build, review and deploy

Run these commands from the `road/tmc` project directory after changing the shared package or
TMC stack. `rush build --to .` builds TMC and its workspace dependencies, including the shared
listing package.

```bash
rush build --to .
rushx cdk-diff-road-test
```

Deploy to test only after reviewing the diff:

```bash
rushx cdk-deploy-road-test
```

The project has corresponding `cdk-diff-road-prod` and `cdk-deploy-road-prod` scripts for
production. Use them in the same way during the agreed production deployment window.

If the CloudFront routing changes, review and deploy that project separately:

```bash
cd ../../other/cloudfront
rushx cdk-diff-road-test
rushx cdk-deploy-road-test
```

During active iteration, run the shared package in watch mode from its project directory:

```bash
cd other/s3-listing-website
rushx build:watch
```

See the [shared package README](../../other/s3-listing-website/README.md) for its development
details.

The directory-index CloudFront function belongs to the separate `other/cloudfront` project. If
the website deployment succeeds but the page shows no folders, verify that the CloudFront
behavior is deployed as well:

```bash
cd other/cloudfront
rushx cdk-diff-road-test
rushx cdk-deploy-road-test
```

The CloudFront distribution may cache an earlier response. After deployment, use a hard refresh
or wait for the relevant cache entry to expire before testing the listing again.

