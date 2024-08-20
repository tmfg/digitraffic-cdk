//eslint-disable-next-line no-var
var VERSION_INDEX_HTML = "EXT_VERSION";

interface CloudfrontEvent {
    request: {
        uri: string;
    };
}

/*
    This is a edge function that should be run at cloudfront at viewer request event.
    It adds index.html to request end if missing.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
// @ts-ignore
function handler(event: CloudfrontEvent): CloudfrontEvent["request"] {
    const request = event.request;
    const uri = request.uri;

    if (uri.endsWith("/")) {
        request.uri += "index.html";
    }

    return request;
}

// CloudFront does not recognize exports which is needed for testing. However, CF does not recognize
// console.error either, so this is a hacky way to make sure that CF doesn't blow up for this bit
// of code but also makes it possible to run tests.
// @ts-ignore
// eslint-disable-next-line no-console
if (console.error) {
    // use VERSION_INDEX_HTML to make sure that the code is included in the result and updated when deploying
    // eslint-disable-next-line no-console
    console.log(VERSION_INDEX_HTML);
    module.exports = {
        handler
    };
}
