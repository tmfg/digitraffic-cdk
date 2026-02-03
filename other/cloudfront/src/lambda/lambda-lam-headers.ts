import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import * as Utils from "@digitraffic/common/dist/utils/utils";
import type {
  CloudFrontRequest,
  CloudFrontResponseEvent,
  CloudFrontResponseHandler,
} from "aws-lambda";
import queryStringHelper from "querystring";
import { createAndLogError } from "./header-util.js";

export const HEADERS = {
  CONTENT_DISPOSITION: "Content-Disposition",
  CONTENT_TYPE: "Content-Type",
  REMAPPED_HOST: "x-amzn-remapped-host",
  X_API_KEY: "x-api-key",
} as const;

/*
    This is an edge lambda that should be run at cloudfront at viewer response event.
    It adds CORS headers to a response.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
export const handler: CloudFrontResponseHandler = async (
  event: CloudFrontResponseEvent,
) => {
  const records = event.Records;
  if (records) {
    const record = records[0];

    if (!record) {
      throw createAndLogError(
        "lambda-lam-headers.handler",
        "Records did not have a record",
      );
    }
    const { request, response } = record.cf;
    const { headers } = response;

    if (Utils.hasOwnPropertySafe(headers, HEADERS.REMAPPED_HOST)) {
      // Create filename
      const filename = createFilename(request);

      headers[HEADERS.CONTENT_DISPOSITION.toLowerCase()] = [
        {
          key: HEADERS.CONTENT_DISPOSITION,
          value: `attachment; filename="${filename}"`,
        },
      ];

      headers[HEADERS.CONTENT_TYPE.toLowerCase()] = [
        {
          key: HEADERS.CONTENT_TYPE,
          value: "text/csv; charset=utf-8",
        },
      ];
    }

    // Delete apikey that SnowFlake is returning for some reason
    delete headers[HEADERS.X_API_KEY];
    delete headers["x-amzn-remapped-x-forwarded-for"];
    delete headers["x-amzn-remapped-host"];

    logger.info({
      method: "lambda-lam-headers.handler",
      message: "Lam headers called",
      customOutgoingUri: request.uri,
      customHeaders: JSON.stringify(headers),
      customResponseHeaders: JSON.stringify(response.headers),
    });

    return response;
  } else {
    throw createAndLogError(
      "lambda-lam-headers.handler",
      "Event did not have records",
    );
  }
};

function createFilename(
  request: Omit<
    CloudFrontRequest,
    "body" | "headers" | "method" | "origin" | "clientIp"
  >,
): string {
  // eslint-disable-next-line dot-notation
  const type = request["uri"].substring(1); // ie. uri=/liikennemaara
  // eslint-disable-next-line dot-notation
  const params = queryStringHelper.parse(request["querystring"]); // ie. tyyppi=h&pvm=2023-03-01&loppu=&lam_type=option1&piste=1
  // eslint-disable-next-line dot-notation
  const subType = typeof params["tyyppi"] === "string" ? params["tyyppi"] : ""; // ie. v (vuosi), h (tunti), vrk (vuorokausi), ...
  // eslint-disable-next-line dot-notation
  const dateOrWeek = getDateOrWeek(params["pvm"], params["viikko"]); // One of these should always exist
  return `${type}_${subType}_${dateOrWeek}.csv`;
}

function getDateOrWeek(
  date: string | string[] | undefined,
  week: string | string[] | undefined,
): string {
  if (typeof date === "string" && date) {
    return date;
  } else if (typeof week === "string" && week) {
    return week;
  }
  throw new Error(
    `method=tmsHistoryHeaders.getDateOrWeek failed for pvm: ${
      date?.toString() ?? "undefined"
    } and viikko: ${week?.toString() ?? "undefined"}`,
  );
}
