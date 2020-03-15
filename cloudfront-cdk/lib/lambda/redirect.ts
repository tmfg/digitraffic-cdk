exports.handler = function handler(event: any, context: any, callback: any) {
    const { request } = event.Records[0].cf;
    const { uri } = request;

    if(uri.includes('/')) {
        // should rewrite here!
    }

    // If nothing matches, return request unchanged
    callback(null, request);
};