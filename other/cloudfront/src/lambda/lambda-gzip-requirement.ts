import { addCorsHeaders, createAndLogError } from "../lambda-util.js";
import type { CloudFrontRequest, CloudFrontRequestEventRecord, CloudFrontRequestHandler } from "aws-lambda";

const VERSION_HEADERS = "EXT_VERSION";

/*
    This is a edge lambda that should be run at cloudfront at origin request event.
    It checks the request for accept-encoding header and if it does not contains gzip return 406.
    It also intercepts HTTP OPTIONS preflight requests to return CORS data.

    Please see lambda-versions.ts
 */
export const handler: CloudFrontRequestHandler = (event, context, callback) => {
    const records = event.Records;
    if (records) {
        const record = records[0];
        if (!record) {
            const err = createAndLogError("lambda-gzip-requirement.handler", "Records did not have a record");
            callback(err);
            throw err;
        }
        const request: CloudFrontRequest = record.cf.request;

        if (isOptionsRequest(request)) {
            const response = {
                status: "204",
                statusDescription: "No Content",
                headers: {
                    "access-control-max-age": [
                        {
                            key: "access-control-max-age",
                            value: "86400"
                        }
                    ]
                }
            };
            addCorsHeaders(response);
            callback(null, response);
        } else if (!isAcceptGzipHeaderPresent(request) && isGetRequest(request)) {
            const response = {
                status: "406",
                statusDescription: "Not Acceptable",
                body: "Use of gzip compression is required with Accept-Encoding: gzip header."
            };

            callback(null, response);
        }

        // correct header, please continue
        callback(null, request);
    } else {
        const err = createAndLogError("lambda-gzip-requirement.handler", "Event did not have records");
        callback(err);
        throw err;
    }
};

function isOptionsRequest(request: CloudFrontRequest): boolean {
    return request.method === "OPTIONS";
}

function isGetRequest(request: CloudFrontRequest): boolean {
    return request.method === "GET";
}

function isAcceptGzipHeaderPresent(request: CloudFrontRequest): boolean {
    // everything will be lower-case, so no problemos!
    const headers = request.headers;
    const acceptHeader = headers["accept-encoding"];
    if (!acceptHeader) {
        return false;
    }
    const acceptHeaderValue = acceptHeader[0];

    return (
        // eslint-disable-next-line eqeqeq
        acceptHeaderValue != null &&
        // eslint-disable-next-line eqeqeq
        acceptHeaderValue.value != null &&
        acceptHeaderValue.value.indexOf("gzip") > -1
    );
}