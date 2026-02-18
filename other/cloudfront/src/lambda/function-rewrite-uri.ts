import type { CloudfrontEvent } from "./function-events.js";
import { removePathParts } from "./uri-util.js";

const pathsToRemove = Number.parseInt("EXT_PATHS_TO_REMOVE", 10);

/**
 * This is a cloudfront function that should run as viewer request event.
 * It removes part of the uri.
 *
 * Useful when you want path /some/path/filename.z to retrieve filename.z from S3 bucket
 */
export function handler(event: CloudfrontEvent): CloudfrontEvent["request"] {
  const request = event.request;

  request.uri = removePathParts(request.uri, pathsToRemove);

  return request;
}
