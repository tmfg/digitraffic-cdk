import * as Utils from "@digitraffic/common/dist/utils/utils";
import type {
    CloudFrontResponseEvent,
    CloudFrontResponseHandler,
    CloudFrontResponseResult
} from "aws-lambda";
import type { CloudFrontRequest, Callback, Context } from "aws-lambda";
import queryStringHelper from "querystring";
import { createAndLogError } from "../lambda-util.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

/*
    This is an edge lambda that should be run at cloudfront at viewer response event.
    It adds CORS headers to a response.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
export const handler: CloudFrontResponseHandler = (
    event: CloudFrontResponseEvent,
    _: Context,
    callback: Callback<CloudFrontResponseResult>
): void => {
    const records = event.Records;
    if (records) {
        const record = records[0];

        if (!record) {
            const err = createAndLogError("lambda-lam-headers.handler", "Records did not have a record");
            callback(err);
            throw err;
        }
        const request = record.cf.request;
        const response = record.cf.response;

        const { headers } = response;

        const headerContentDisp = "Content-Disposition";
        const headerContentType = "Content-Type";

        if (Utils.hasOwnPropertySafe(headers, "x-amzn-remapped-host")) {
            // Create filename
            const filename = createFilename(request);

            headers[headerContentDisp.toLowerCase()] = [
                {
                    key: headerContentDisp,
                    value: 'attachment; filename="' + filename + '"'
                }
            ];

            headers[headerContentType.toLowerCase()] = [
                {
                    key: headerContentType,
                    value: "text/csv; charset=utf-8"
                }
            ];
        }

        // Delete apikey that SnowFlake is returning for some reason
        delete headers["x-api-key"];
        delete headers["x-amzn-remapped-x-forwarded-for"];
        delete headers["x-amzn-remapped-host"];

        logger.info({
            method: "lambda-lam-headers.handler",
            message: "Lam headers called",
            customOutgoingUri: request.uri,
            customHeaders: JSON.stringify(headers),
            customResponseHeaders: JSON.stringify(response.headers)
        });
        callback(null, response);
    } else {
        const err = createAndLogError("lambda-lam-headers.handler", "Event did not have records");
        callback(err);
        throw err;
    }
};

function createFilename(
    request: Omit<CloudFrontRequest, "body" | "headers" | "method" | "origin" | "clientIp">
): string {
    const type = request["uri"].substring(1); // ie. uri=/liikennemaara
    const params = queryStringHelper.parse(request["querystring"]); // ie. tyyppi=h&pvm=2023-03-01&loppu=&lam_type=option1&piste=1
    const subType = typeof params["tyyppi"] === "string" ? params["tyyppi"] : ""; // ie. v (vuosi), h (tunti), vrk (vuorokausi), ...
    const dateOrWeek = getDateOrWeek(params["pvm"], params["viikko"]); // One of these should always exist
    return `${type}_${subType}_${dateOrWeek}.csv`;
}

function getDateOrWeek(date: string | string[] | undefined, week: string | string[] | undefined): string {
    if (typeof date === "string" && date) {
        return date;
    } else if (typeof week === "string" && week) {
        return week;
    }
    throw new Error(
        `method=tmsHistoryHeaders.getDateOrWeek failed for pvm: ${
            date?.toString() ?? "undefined"
        } and viikko: ${week?.toString() ?? "undefined"}`
    );
}
