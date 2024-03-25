/*
Adds '/' to the end of path if it is missing when navigating to /history page.
Apparantely the Angular app doesn't function well if it is missing.
 */
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri.endsWith('/history')) {
        request.uri += '/';
    }

    return request;
}
