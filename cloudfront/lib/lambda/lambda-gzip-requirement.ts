const VERSION_GZIP = "EXT_VERSION";

/*
    This is a edge lambda that should be run at cloudfront at origin request event.
    It checks the request for accept-encoding header and if it does not contains gzip return 406.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't make new lambda version
    if the code does not change.
 */
exports.handler = function handler(event: any, context: any, callback: any) {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    const acceptHeader = headers['accept-encoding'][0];

    if(acceptHeader == null || acceptHeader.value == null || acceptHeader.value.indexOf('gzip') < 0) {
        const response = {
            status: 406,
            statusDescription: "Not Acceptable",
            body: "Use of gzip compression is required."
        };

        callback(null, response);
    }

    // correct header, please continue
    callback(null, request);
};