import { addCorsHeaders, addWeathercamImageLastModifiedHeaderFromXAmzMeta } from "../lambda-util.js";

const VERSION_HEADERS = "EXT_VERSION";

/*
    This is a edge lambda that should be run at cloudfront at viewer response event.
    It adds CORS headers to a response.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
exports.handler = (event: any, context: any, callback: any) => {
    const request = event.Records[0].cf.request;
    const response = event.Records[0].cf.response;

    if (request.method === "GET") {
        addCorsHeaders(response);
    }

    callback(null, response);
};
