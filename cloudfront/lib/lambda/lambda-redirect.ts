const domainName = "EXT_DOMAIN_NAME";
const hostName = "EXT_HOST_NAME";

const hostHeader = [{ key: 'host', value: hostName}];
const sslProtocols = ['TLSv1', 'TLSv1.1'];

const VERSION = "EXT_VERSION";

/*
    This is a edge lambda that should be run at cloudfront at origin request event.
    It checks for querystring and if it exists, it will rewrite the request origin
    to new domain with new hostname(use this as InlineCode and replace EXT_DOMAIN_NAME and EXT_HOST_NAME).

    Also replace EXT_VERSION with timestamp to change code when deploying.  You can't make new lambda version
    if the code does not change.

    Example:
    https://origin-address/C123.jpg -> no changes, send request to that origin
    https://origin-address/C123.jpg?versionId=123 -> send request to new origin http://DOMAIN_NAME/C123.jpg?versionId=123
 */
exports.handler = function handler(event: any, context: any, callback: any) {
    const { request } = event.Records[0].cf;
    const { querystring } = request;

    if(querystring.length > 0) {
        request.origin = {
            custom: {
                domainName: domainName,
                port: 80,
                protocol: 'http',
                path: '',
                sslProtocols: sslProtocols,
                readTimeout: 5,
                keepaliveTimeout: 5,
                customHeaders: {}
            }
        };
        request.headers['host'] = hostHeader;
    }

    // If nothing matches, return request unchanged
    callback(null, request);
};