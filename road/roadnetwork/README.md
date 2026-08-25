# Road Network

Publishes Road Network dataset releases at
[tie.digitraffic.fi/roadnetwork/](https://tie.digitraffic.fi/roadnetwork/).
Replaces the Digiroad distribution previously served from Väylä's AVA service.

## Structure

The stack creates one S3 bucket per environment (`roadnetwork-<env>`) and deploys a static listing page into it. CloudFront serves both the
page and the datasets under the `roadnetwork/*` behaviour of the road distribution;
the behaviour is configured in `digitraffic-ci-internal/aws/cdk/other/cloudfront/cloudfront-road.ts`.
The stack also creates placeholder objects (`.keep`) under `latest/`, `releases/` and
`digiroad/` so the intended root folder structure is visible from day one.

```
roadnetwork-<env>/
├── index.html, assets/     site, deployed by this stack
├── latest/                 most recent Road Network release
├── releases/               Road Network era releases, from 2027 onwards
└── digiroad/2026_1, 2026_2 legacy Digiroad releases
```

## Publishing

The Road Network team publishes the datasets themselves from their own AWS account. Access is
granted in the bucket policy to their configured SSO publisher permission set and limited to
the three data prefixes, so the site files cannot be overwritten. The account ids are
configured per environment in `digitraffic-ci-internal`.

Individual dataset packages are over 5 GB, which forces multipart uploads. Use the CLI
rather than the console:

```bash
aws s3 sync ./2027_1/ s3://<bucket-name>/releases/2027_1/ --profile <aws-profile>
aws s3 sync s3://<bucket-name>/releases/2027_1/ s3://<bucket-name>/latest/ --delete
```

S3 has no symlinks, so `latest/` is a copy of the most recent release.

Re-running the stack is non-destructive: CloudFormation updates resources in place,
`prune: false` keeps dataset objects intact, and the placeholder objects are updated in place
rather than re-creating the bucket.

The bucket is not visible in the S3 console bucket list from another account; use a
direct link to the configured bucket instead:
`https://eu-west-1.console.aws.amazon.com/s3/buckets/<bucket-name>`.

The bucket uses S3 Bucket owner enforced object ownership, so ACLs are disabled. Publisher access
is controlled by the bucket policy and is limited to the three data prefixes. Uploads must not
include an ACL, such as `--acl public-read`; S3 console uploads that try to configure an ACL fail
with `AccessControlListNotSupported`. Test cross-account access with the CLI:

```bash
aws s3 cp ./test.txt s3://<bucket-name>/latest/test.txt --profile <aws-profile>
aws s3 cp s3://<bucket-name>/latest/test.txt ./test-download.txt --profile <aws-profile>
aws s3 rm s3://<bucket-name>/latest/test.txt --profile <aws-profile>
```

Publisher access is limited to `latest/`, `releases/` and `digiroad/`. The website files, such as
`index.html`, are intentionally not readable or writable by the publisher account.

## Inspecting bucket contents

List every object in the bucket, including nested release folders:

```bash
export AWS_PROFILE=<aws-profile>
aws s3 ls s3://<bucket-name>/ --recursive --human-readable --summarize
```

Use the environment-specific bucket name and AWS profile from the private deployment
configuration; keep them as placeholders in documentation and commands you share.

## Versioning

Versioning is enabled because publishers have delete rights, and noncurrent versions
expire after 14 days. That gives a two week undo window at negligible cost, since
releases happen about twice a year.

## Listing page

`src/website` is a dependency-free page that lists the bucket contents live through
`ListObjectsV2` (`/roadnetwork/?list-type=2&delimiter=/&prefix=...`). This requires
`s3:ListBucket` for the CloudFront origin access control, which the stack grants.
Available in Finnish and English via the hash query parameter `lang=fi|en`.
The browser location uses the hash for the current folder and a hash query parameter for the
page and language, so a shareable English link to page 10 of `releases/` is:

```text
/roadnetwork/#/releases/?page=10&lang=en
```

### How the listing works

The listing request uses the same CloudFront path as the website:

```text
/roadnetwork/?list-type=2&delimiter=/&prefix=
```

The CloudFront `DirectoryIndexFunction` removes the `/roadnetwork/` path prefix before the
request reaches S3. A request with a query string is deliberately left as `/`, so S3 handles it
as a `ListObjectsV2` request instead of returning `index.html`. S3 returns folders as
`CommonPrefixes` and files as `Contents`; the browser parses that XML response and renders the
listing. The CloudFront origin access control needs both `s3:GetObject` for the page and
`s3:ListBucket` for these listing requests.

The browser follows S3 continuation tokens when a directory contains more than 1,000 entries.
It then sorts the combined result by name in descending order by default and displays 20 entries
per page. The `Nimi`, `Koko` and `Muokattu` headings can be used to change the sort column and
direction.

### Pagination test data

Temporary pagination data can be created in the test bucket with 50 folders under `releases/`.
Each folder is named in `yyyy_mm` format and contains three small text files. Run these commands
from the `road/roadnetwork` project directory:

```bash
export AWS_PROFILE=<road-test-aws-profile>
export ROADNETWORK_TEST_BUCKET=<roadnetwork-test-bucket>
export ROADNETWORK_TEST_ACCOUNT=<test-account-id>
rushx test-data:create
```

Use the environment-specific values from the private deployment configuration. These values are
identifiers, not credentials, but keeping them as placeholders avoids publishing environment
details in the repository documentation.

The script uses the supplied AWS profile and verifies that the caller account matches
`ROADNETWORK_TEST_ACCOUNT` before uploading. Remove only the files created by the script with:

```bash
rushx test-data:delete
```

The delete command asks for confirmation and does not remove other objects under `releases/`.

The directory-index CloudFront function belongs to the separate `other/cloudfront` project. If
the website deployment succeeds but the page shows no folders, verify that the CloudFront
behavior is deployed as well:

```bash
cd other/cloudfront
node ../../common/scripts/install-run-rushx.js cdk-diff-road-test
node ../../common/scripts/install-run-rushx.js cdk-deploy-road-test
```

The CloudFront distribution may cache an earlier response. After deployment, use a hard refresh
or wait for the relevant cache entry to expire before testing the listing again.

### Local preview

Run a local static server from the project root without changing directories.
Preferred option is the project script via `rushx`:

```bash
rushx serve:website:local
```

Equivalent direct command:

```bash
npx serve@14.2.6 src/website -l 8080
```

Then open `http://localhost:8080/`.
For a local preview with English mock data, open
`http://localhost:8080/#/?mock=1&lang=en`.
