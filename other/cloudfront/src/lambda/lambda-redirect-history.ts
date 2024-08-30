interface CloudfrontEvent {
    request: {
        uri: string;
    };
}

interface CloudfrontResponse {
    statusCode: number;
    headers: {
        location: {
            value: string;
        };
    };
}

/*
Adds '/' to the end of path if it is missing when navigating to /history page.
Apparantely the Angular app doesn't function well if it is missing.
 */
// @ts-ignore
function handler(event: CloudfrontEvent): CloudfrontEvent["request"] | CloudfrontResponse {
    const request = event.request;
    const uri = request.uri;

    if (uri.match(/^\/history$/)) {
        return {
            statusCode: 301,
            headers: {
                location: {
                    value: `${uri}/`
                }
            }
        };
    }

    return request;
}

// CloudFront does not recognize exports which is needed for testing. However, CF does not recognize
// console.error either, so this is a hacky way to make sure that CF doesn't blow up for this bit
// of code but also makes it possible to run tests.
// @ts-ignore
// eslint-disable-next-line no-console
if (console.error) {
    module.exports = {
        handler
    };
}
