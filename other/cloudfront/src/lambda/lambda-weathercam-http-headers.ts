import type { CloudFrontResponseHandler } from "aws-lambda";
import {
  addWeathercamImageLastModifiedHeaderFromXAmzMeta,
  createAndLogError,
} from "./header-util.js";
import { IMAGE_NOT_AVAILABLE_BASE64 } from "./image-not-available.js";

// TODO: is this needed anymore?
// You must replace EXT_VERSION with timestamp to change code when deploying.
// You can't deploy a new lambda version if the code does not change.
const _VERSION_HEADERS = "EXT_VERSION";

const ERROR_STATUSES = new Set(["403", "404"]);

/*
    This is a edge lambda that should be run at cloudfront at origin response event.
    It reads S3 custom header for weathercam image modification time and adds it as last-modified header value to a response.

    If the origin (S3) returns 403 or 404, the lambda replaces the response body
    with an "image not available" placeholder JPEG and sets Cache-Control: no-cache
    so the browser will re-check on the next request.

    The response object is modified in place rather than replaced, because returning
    a new object that omits read-only headers (Content-Length, Transfer-Encoding)
    present in the original S3 response triggers a CloudFront validation error.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
export const handler: CloudFrontResponseHandler = async (event) => {
  const records = event.Records;
  if (records) {
    const record = records[0];
    if (!record) {
      throw createAndLogError(
        "lambda-weathercam-http-headers.handler",
        "Records did not have a record",
      );
    }
    const request = record.cf.request;
    const response = record.cf.response;

    if (ERROR_STATUSES.has(response.status)) {
      // Modify the existing response in place to replace the S3 error with
      // our placeholder image. We must not return a new object that drops
      // read-only headers (Content-Length, Transfer-Encoding) from the
      // original response — CloudFront treats that as "deleting" them.
      response.status = "200";
      response.statusDescription = "OK";
      response.headers["content-type"] = [
        { key: "Content-Type", value: "image/jpeg" },
      ];
      response.headers["cache-control"] = [
        { key: "Cache-Control", value: "no-cache" },
      ];

      // body and bodyEncoding are not in the CloudFrontResponse type but are
      // supported at runtime for origin-response events (up to 1 MB).
      // biome-ignore lint/suspicious/noExplicitAny: CloudFront runtime feature not in type definitions
      (response as any).body = IMAGE_NOT_AVAILABLE_BASE64;
      // biome-ignore lint/suspicious/noExplicitAny: CloudFront runtime feature not in type definitions
      (response as any).bodyEncoding = "base64";

      return response;
    }

    if (request.method === "GET") {
      addWeathercamImageLastModifiedHeaderFromXAmzMeta(response);
    }

    return response;
  } else {
    throw createAndLogError(
      "lambda-weathercam-http-headers.handler",
      "Event did not have records",
    );
  }
};
