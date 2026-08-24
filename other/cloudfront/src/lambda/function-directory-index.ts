import type { CloudfrontEvent } from "./function-events.js";
import { removePathParts } from "./uri-util.js";

/** Replaced with the number of leading URI path segments to remove, see `createDirectoryIndexFunction`. */
const leadingPathSegmentsToRemove = Number.parseInt("EXT_PATHS_TO_REMOVE", 10);

/**
 * This is a cloudfront function that should run as viewer request event.
 * It removes part of the uri and serves index.html for directory requests.
 *
 * With one leading path segment removed, the public CloudFront prefix is stripped before S3:
 * - `/roadnetwork/latest/data.zip` -> `/latest/data.zip`
 * - `/roadnetwork/latest/` -> `/latest/index.html`
 * - `/roadnetwork/?list-type=2` -> `/` (query string means the caller wants the S3 api, not the page)
 *
 * Combines what `function-rewrite-uri` and `function-index-html` do, since CloudFront allows
 * only one viewer request function per behavior.
 */
export function handler(
  event: CloudfrontEvent,
  leadingPathSegmentsToRemoveCount = leadingPathSegmentsToRemove,
): CloudfrontEvent["request"] {
  const request = event.request;
  const uri = removePathParts(request.uri, leadingPathSegmentsToRemoveCount);
  const isListObjectsRequest = request.querystring["list-type"]?.value === "2";

  request.uri =
    uri.endsWith("/") && !isListObjectsRequest ? `${uri}index.html` : uri;

  return request;
}
