import queryStringHelper from "node:querystring";
import type { CloudFrontRequest, CloudFrontRequestHandler } from "aws-lambda";
import { createAndLogError } from "./header-util.js";
import { removePathParts } from "./uri-util.js";

/** Replaced with the number of leading URI path segments to remove, see `createDirectoryIndex`. */
const leadingPathSegmentsToRemove = Number.parseInt("EXT_PATHS_TO_REMOVE", 10);

// Query param S3's REST API uses to select the ListObjectsV2 operation - see
// https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html
const S3_LIST_TYPE_PARAM = "list-type";
const S3_LIST_TYPE_V2 = "2";

/**
 * Removes leading URI path segments and serves `index.html` for directory requests - same
 * behaviour as `Behavior.withDirectoryIndexFunction()` previously implemented as a CloudFront
 * Function at the viewer-request event.
 *
 * This runs at the origin-request event instead. CloudFront Functions attached to viewer-request
 * run *before* the cache lookup, so a URI rewrite there also changes the cache key. Multiple
 * behaviors on different origins that strip the same number of path segments down to the same
 * relative asset paths (e.g. `/tmc/assets/config.js` and `/roadnetwork/assets/config.js` both
 * becoming `/assets/config.js`) would then collide into the same cache entry, causing one site's
 * content to sometimes be served for the other. Origin-request lambdas run only after the cache
 * decision has already been made from the original, always-distinct request path, so this cannot
 * happen here.
 *
 * With `pathPartsToRemove = 1`, the leading `/roadnetwork` segment is removed:
 * - `/roadnetwork/assets/app.js` -> object key `assets/app.js`
 * - `/roadnetwork/latest/data.zip` -> object key `latest/data.zip`
 * - `/roadnetwork/` -> object key `index.html`
 * - `/roadnetwork/latest/` -> object key `latest/index.html`
 * - `/roadnetwork/?list-type=2&delimiter=/&prefix=latest/` -> S3 bucket listing request for
 *   prefix `latest/`
 */
export function rewriteUri(
  uri: string,
  querystring: string,
  pathPartsToRemove: number,
): string {
  const strippedUri = removePathParts(uri, pathPartsToRemove);
  const parsedQuery = queryStringHelper.parse(querystring);
  const isListObjectsRequest =
    parsedQuery[S3_LIST_TYPE_PARAM] === S3_LIST_TYPE_V2;
  const endsWithSlash = strippedUri.length > 0 && strippedUri.endsWith("/");

  return endsWithSlash && !isListObjectsRequest
    ? `${strippedUri}index.html`
    : strippedUri;
}

export const handler: CloudFrontRequestHandler = async (event) => {
  const records = event.Records;
  if (!records) {
    throw createAndLogError(
      "lambda-directory-index.handler",
      "Event did not have records",
    );
  }

  const record = records[0];
  if (!record) {
    throw createAndLogError(
      "lambda-directory-index.handler",
      "Records did not have a record",
    );
  }

  const request: CloudFrontRequest = record.cf.request;
  request.uri = rewriteUri(
    request.uri,
    request.querystring,
    leadingPathSegmentsToRemove,
  );

  return request;
};
