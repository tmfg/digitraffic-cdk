var VERSION_INDEX_HTML = "EXT_VERSION";

/*
    This is a edge function that should be run at cloudfront at viewer request event.
    It adds index.html to request end if missing.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri.endsWith("/")) {
        request.uri += "index.html";
    }

    return request;
}
