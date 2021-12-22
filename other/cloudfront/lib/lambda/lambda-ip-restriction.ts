const ALLOWED_IPS = "EXT_IP".split(',');

/*
    This is a edge lambda that should be run at cloudfront at origin request event.
    It checks the request for correct ip-address and return 403 if it does not match.

    Please see lambda-versions.ts
 */

const FORBIDDEN = {
    status: 403,
    statusDescription: 'Forbidden',
};

exports.handler = function handler(event: any, context: any, callback: any) {
    const request = event.Records[0].cf.request;

    if (ALLOWED_IPS.indexOf(request.clientIp) === -1) {
        callback(null, FORBIDDEN);
    }

    callback(null, request);
};
