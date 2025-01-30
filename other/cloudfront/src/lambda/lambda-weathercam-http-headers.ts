import {
  addWeathercamImageLastModifiedHeaderFromXAmzMeta,
  createAndLogError,
} from "../lambda-util.js";
import type { CloudFrontResponseHandler } from "aws-lambda";

const VERSION_HEADERS = "EXT_VERSION";

/*
    This is a edge lambda that should be run at cloudfront at viewer response event.
    It reads S3 custom header for weathercam image modification time and adds it as last-modified header value to a response.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
export const handler: CloudFrontResponseHandler = (
  event,
  context,
  callback,
) => {
  const records = event.Records;
  if (records) {
    const record = records[0];
    if (!record) {
      const err = createAndLogError(
        "lambda-weathercam-http-headers.handler",
        "Records did not have a record",
      );
      callback(err);
      throw err;
    }
    const request = record.cf.request;
    const response = record.cf.response;

    if (request.method === "GET") {
      addWeathercamImageLastModifiedHeaderFromXAmzMeta(response);
    }

    callback(null, response);
  } else {
    const err = createAndLogError(
      "lambda-weathercam-http-headers.handler",
      "Event did not have records",
    );
    callback(err);
    throw err;
  }
};
