import type { CloudfrontEvent, CloudfrontResponse } from "./function-events.js";

const RESPONSE = {
  statusCode: 302,
  statusDescription: "Found",
  headers: {
    "location": {
      "value": "EXT_REDIRECT_URL",
    },
  },
};

export function handler(_event: CloudfrontEvent): CloudfrontResponse {
  return RESPONSE;
}
