import type { CloudFrontRequest, CloudFrontRequestHandler } from "aws-lambda";
import { createAndLogError } from "../lambda-util.js";

const ALLOWED_IPS = "EXT_IP".split(",");

const VERSION_HEADERS = "EXT_VERSION";

/*
    This is a edge lambda that should be run at cloudfront at origin request event.
    It checks the request for correct ip-address and return 403 if it does not match.   
 */

const FORBIDDEN = {
    status: "403",
    statusDescription: "Forbidden"
} as const;

export const handler: CloudFrontRequestHandler = (event, context, callback) => {
    const records = event.Records;
    if (records) {
        const record = records[0];
        if (!record) {
            const err = createAndLogError("lambda-ip-restriction.handler", "Records did not have a record");
            callback(err);
            throw err;
        }
        const request: CloudFrontRequest = record.cf.request;

        if (ALLOWED_IPS.indexOf(request.clientIp) === -1) {
            callback(null, FORBIDDEN);
            return;
        }

        callback(null, request);
    } else {
        const err = createAndLogError("lambda-ip-restriction.handler", "Event did not have records");
        callback(err);
        throw err;
    }
};
