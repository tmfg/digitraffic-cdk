import type { CloudfrontEvent, CloudfrontResponse } from "./function-events.js";
import { addCorsHeadersToFunctionResponse } from "./header-util.js";

/*
    This is a cloudfront function that should be run at cloudfront at viewer response event.
    It adds CORS headers to a response.
 */
export function handler(event: CloudfrontEvent): CloudfrontResponse {
  const request = event.request;
  const response = event.response;

  if (request.method === "GET") {
    addCorsHeadersToFunctionResponse(response);
  }

  return response;
}
