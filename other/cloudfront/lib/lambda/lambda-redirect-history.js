/*
Adds '/' to the end of path if it is missing when navigating to /history page.
Apparantely the Angular app doesn't function well if it is missing.
 */
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri.match(/^\/history$/)) {
        return {
            statusCode: 301,
            headers: {
                "location": {
                    "value": `${uri}/`
                }
            }
        }
    }

    return request;
}

// CloudFront does not recognize exports which is needed for testing. However, CF does not recognize
// console.error either, so this is a hacky way to make sure that CF doesn't blow up for this bit
// of code but also makes it possible to run tests.
if (console.error) {
    module.exports = {
        handler
    };
}