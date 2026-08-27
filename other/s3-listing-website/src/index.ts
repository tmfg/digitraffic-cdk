import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ISource } from "aws-cdk-lib/aws-s3-deployment";
import { Source } from "aws-cdk-lib/aws-s3-deployment";

export interface ListingMessages {
  readonly title: string;
  readonly intro: string;
}

export interface MockListingFile {
  readonly key: string;
  readonly size: number;
  readonly modified: string;
}

export interface MockListingEntry {
  readonly folders: readonly string[];
  readonly files: readonly MockListingFile[];
}

export interface ListingWebsiteConfig {
  /** CloudFront path prefix this site is served under, e.g. `"/tmc/"`. Must end with `/`. */
  readonly basePath: string;
  /** Object keys to hide from the listing, in addition to the engine's own defaults. */
  readonly hiddenKeys?: readonly string[];
  /** Only `title`/`intro` are used here; every other UI string comes from the shared engine. */
  readonly messages: {
    readonly fi: ListingMessages;
    readonly en: ListingMessages;
  };
  /** Shown behind `?mock=1` for local preview only; never used against a real deployment. */
  readonly mockListing?: Record<string, MockListingEntry>;
}

const ENGINE_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "engine",
);

/**
 * Builds the `BucketDeployment.sources` array for a bucket-listing website: the shared engine
 * (`index.html`, `assets/app.js`, `assets/styles.css`, `assets/fintraffic-logo.svg`) plus a
 * generated `assets/config.js` carrying this site's own configuration.
 *
 * CDK merges multiple `BucketDeployment` sources by destination path (a later source wins), so
 * a project can append its own `Source.asset(...)` afterwards to override any engine file, e.g.
 * to ship a custom `index.html`.
 */
export function createListingWebsiteSources(
  config: ListingWebsiteConfig,
): ISource[] {
  // mockListing is for local preview only (see scripts/serve-local.mjs) and must never reach
  // the deployed config.js, or "?mock=1" would replace the real listing on the live site.
  const { mockListing: _mockListing, ...deployedConfig } = config;
  return [
    Source.asset(ENGINE_DIR),
    Source.data(
      "assets/config.js",
      `window.LISTING_CONFIG = ${JSON.stringify(deployedConfig, null, 2)};\n`,
    ),
  ];
}
