const ALLOWED_IPS = "EXT_IP".split(',');
const VERSION_GZIP = "EXT_VERSION";

/*
    This is a edge lambda that should be run at cloudfront at origin request event.
    It checks the request for correct ip-address and return 403 if it does not match.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't make new lambda version
    if the code does not change.
 */
exports.handler = function handler(event: any, context: any, callback: any) {
    const request = event.Records[0].cf.request;

    if(ALLOWED_IPS.indexOf(request.clientIp) == -1) {
        const response = {
            status: 403,
            statusDescription: 'Forbidden',
        };
        callback(null, response);
    }

    callback(null, request);
};