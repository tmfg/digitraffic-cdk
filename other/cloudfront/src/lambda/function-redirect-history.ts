import type { CloudfrontEvent, CloudfrontResponse } from "./function-events.js";

/**
  Adds '/' to the end of path if it is missing when navigating to /history page.
  Apparantely the Angular app doesn't function well if it is missing.
 */

// @ts-ignore
export function handler(
  event: CloudfrontEvent,
): CloudfrontEvent["request"] | CloudfrontResponse {
  const request = event.request;
  const uri = request.uri;

  if (uri.match(/^\/history$/)) {
    return {
      statusCode: 301,
      headers: {
        location: {
          value: `${uri}/`,
        },
      },
    };
  }

  return request;
}
