import queryStringHelper from "querystring";

/*
    This is a edge lambda that should be run at cloudfront at viewer response event.
    It adds CORS headers to a response.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
exports.handler = async (event: any, context: any) => {
    const { request } = event.Records[0].cf;
    const { response } = event.Records[0].cf;
    const { headers } = response;

    const headerContentDisp = "Content-Disposition";
    const headerContentType = "Content-Type";

    if (headers["x-amzn-remapped-host"]) {
        // Create filename
        const type = request.uri.substring(1);
        const params = queryStringHelper.parse(request.querystring);
        const filename =
            type +
            "_" +
            params.tyyppi +
            "_" +
            (params.pvm || params.viikko) +
            ".csv";

        headers[headerContentDisp.toLowerCase()] = [
            {
                key: headerContentDisp,
                value: 'attachment; filename="' + filename + '"',
            },
        ];

        headers[headerContentType.toLowerCase()] = [
            {
                key: headerContentType,
                value: "text/csv; charset=utf-8",
            },
        ];
    }

    // Delete apikey that SnowFlake is returning for some reason
    delete headers["x-api-key"];
    delete headers["x-amzn-remapped-x-forwarded-for"];
    delete headers["x-amzn-remapped-host"];

    console.log("method=tmsHistoryHeaders Outgoing headers %o, ", headers);

    return response;
};
