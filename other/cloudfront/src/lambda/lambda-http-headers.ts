import type { CloudFrontResponseHandler } from "aws-lambda";
import {
  addCorsHeadersToLambdaResponse,
  createAndLogError,
} from "./header-util.js";

const VERSION_HEADERS = "EXT_VERSION";

/*
    This is a edge lambda that should be run at cloudfront at viewer response event.
    It adds CORS headers to a response.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
export const handler: CloudFrontResponseHandler = async (event) => {
  const records = event.Records;
  if (records) {
    const record = records[0];
    if (!record) {
      throw createAndLogError(
        "lambda-http-headers.handler",
        "Records did not have a record",
      );
    }
    const request = record.cf.request;
    const response = record.cf.response;

    if (request.method === "GET") {
      addCorsHeadersToLambdaResponse(response);
    }

    return response;
  } else {
    throw createAndLogError(
      "lambda-http-headers.handler",
      "Event did not have records",
    );
  }
};
