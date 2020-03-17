const domainName = "EXT_DOMAIN_NAME";
const hostName = "EXT_HOST_NAME";

const hostHeader = [{ key: 'host', value: hostName}];
const sslProtocols = ['TLSv1', 'TLSv1.1'];

const VERSION = "EXT_VERSION";

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