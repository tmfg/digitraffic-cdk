import type { CloudfrontEvent } from "./function-events.js";

/**
    This is a edge function that should be run at cloudfront at viewer request event.
    It adds index.html to request end if missing.
 */
export function handler(event: CloudfrontEvent): CloudfrontEvent["request"] {
  const request = event.request;
  const uri = request.uri;

  if (uri.endsWith("/")) {
    request.uri += "index.html";
  }

  return request;
}
