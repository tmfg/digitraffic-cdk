# s3-listing-website

Shared engine for a live, browsable listing page in front of an S3 bucket that also holds real
data. Used by [road/tmc](../../road/tmc) and [road/roadnetwork](../../road/roadnetwork); reuse it
for any new project that needs the same kind of page instead of copying files between projects.

## How it works

```
other/s3-listing-website/
├── engine/                 the actual site: identical for every project, deployed as-is
│   ├── index.html
│   └── assets/
│       ├── app.js          lists the bucket live via S3 ListObjectsV2, no build step, no framework
│       ├── styles.css
│       └── fintraffic-logo.svg
└── src/
    └── index.ts            exports createListingWebsiteSources(config)
```

`createListingWebsiteSources(config)` returns the `sources` array for a CDK `BucketDeployment`:
the `engine/` directory as-is, plus a generated `assets/config.js` containing that one project's
own `basePath` and `title`/`intro` text. The engine reads this at runtime from
`window.LISTING_CONFIG` — nothing else about a project needs to differ.

```ts
new BucketDeployment(this, "MyWebsite", {
  destinationBucket: bucket,
  sources: createListingWebsiteSources({
    basePath: "/my-prefix/",
    messages: {
      fi: { title: "...", intro: "..." },
      en: { title: "...", intro: "..." },
    },
  }),
  // Keep false: the bucket also contains datasets outside these website sources. Enabling prune
  // would delete those objects because they are not part of this deployment's sources.
  prune: false,
});
```

`mockListing` can also be set on this config, but `createListingWebsiteSources` always strips it
before generating `assets/config.js` — mock data must never reach a real deployment. It only
takes effect through `local-preview.config.json` and `scripts/serve-local.mjs` (see
[Local preview](#local-preview) below), which never goes through `createListingWebsiteSources` at
all.

Only `title`/`intro` are project-specific — every other UI string (column headers, buttons,
pagination, error messages) lives once in the engine's `DEFAULT_MESSAGES` and is used by every
project automatically. `hiddenKeys` can add extra object keys to hide from the listing beyond the
engine's own defaults (`index.html`, `.keep`).

CDK merges a `BucketDeployment`'s `sources` by destination path, so a consuming project could
still append its own `Source.asset(...)` afterwards to override any single engine file — nobody
needs this today, but it's there if a project ever needs a one-off customization.

## Using it in a new project

1. Add the dependency: `"@digitraffic-cdk/s3-listing-website": "workspace:*"` and run
   `rush update`.
2. Call `createListingWebsiteSources(...)` in the stack's `BucketDeployment.sources`, as above.
3. Add a `local-preview.config.json` and a `serve:website:local` script to the project's
   `package.json` — see [Local preview](#local-preview) below.

## Local preview

```bash
rushx serve:website:local
```

runs `scripts/serve-local.mjs --config ./local-preview.config.json`, which copies `engine/` to a
temp directory, writes `assets/config.js` from that project's own `local-preview.config.json`
(same shape as the config passed to `createListingWebsiteSources`, kept only for local preview —
never deployed), and serves it. Open `http://localhost:8080/?mock=1` to see the mock listing
(without `?mock=1` it tries the real S3 REST API, which doesn't exist locally).

`serve` is a devDependency of this package (not an ad hoc `npx serve@...` call), resolved from
`node_modules/.bin/serve` relative to this package regardless of which project's directory the
script runs from, so its version updates through the normal dependency-update process.

## Developing this package

### Development and deployment flow

The shared package is consumed by both `road/tmc` and `road/roadnetwork`. Use this flow after
changing the shared listing website:

1. For `engine/*` changes, run `rushx serve:website:local` in the consuming project to check the
  local page. No package build is needed for the preview.
2. For `src/index.ts` changes, build the consuming project from its project directory. Rush builds
  the shared package first because it is a workspace dependency:

  ```bash
  cd road/tmc  # use road/roadnetwork for the Road Network deployment
  rush build --to .
  ```

3. Review and deploy from the consuming project directory:

  ```bash
  rushx cdk-diff-road-test
  rushx cdk-deploy-road-test
  ```

  Deployment is performed separately for TMC and Road Network. To build or test this package
  independently, use `rushx build` or `rushx test` in `other/s3-listing-website`.

- **Editing `engine/*` (HTML/CSS/JS/SVG):** takes effect immediately, no build needed. Both
  `serve-local.mjs` and `createListingWebsiteSources` read the current files off disk every time
  they run — just re-run `rushx serve:website:local` or `cdk synth`/`diff` in a consuming project.
- **Editing `src/index.ts`** (the `createListingWebsiteSources` logic itself): needs a rebuild.
  Run
  ```bash
  cd other/s3-listing-website && rushx build:watch
  ```
  in its own terminal and leave it running. Because pnpm workspaces symlink
  `node_modules/@digitraffic-cdk/s3-listing-website` straight to this package's folder, `tmc` and
  `roadnetwork` automatically pick up the freshly-compiled `lib/` output on their next
  `cdk synth`/`diff`/`deploy` — no reinstall or manual rebuild needed on their side.
- Run `rushx test` / `rushx build` / `biome check .` here before committing, same as any other
  project.
