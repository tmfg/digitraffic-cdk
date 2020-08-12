import {addCorsHeaders} from "../lambda-util";

const VERSION_GZIP = "EXT_VERSION";

/*
    This is a edge lambda that should be run at cloudfront at origin request event.
    It checks the request for accept-encoding header and if it does not contains gzip return 406.
    It also intercepts HTTP OPTIONS preflight requests to return CORS data.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't make new lambda version
    if the code does not change.
 */
exports.handler = function handler(event: any, context: any, callback: any) {
    const request = event.Records[0].cf.request;

    if (isOptionsRequest(request)) {
        const response = {
            status: 204,
            statusDescription: 'No Content',
            headers: {
                'access-control-max-age': [{
                    key: 'access-control-max-age',
                    value: '86400'
                }]
            }
        };
        addCorsHeaders(response);
        callback(null, response);
    } else if(!isAcceptGzipHeaderPresent(request) && isGetRequest(request)) {
        const response = {
            status: 406,
            statusDescription: "Not Acceptable",
            body: "Use of gzip compression is required with Accept-Encoding: gzip header."
        };

        callback(null, response);
    }

    // correct header, please continue
    callback(null, request);
};

function isOptionsRequest(request: any): boolean {
    return request.method === 'OPTIONS';
}

function isGetRequest(request: any): boolean {
    return request.method === 'GET';
}

function isAcceptGzipHeaderPresent(request: any): boolean {
    // everything will be lower-case, so no problemos!
    const headers = request.headers;
    const acceptHeader = headers['accept-encoding'];
    if (!acceptHeader) {
        return false;
    }
    const acceptHeaderValue = acceptHeader[0];

    return acceptHeaderValue != null && acceptHeaderValue.value != null && acceptHeaderValue.value.indexOf('gzip') > -1;

}