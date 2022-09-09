/* eslint-disable @typescript-eslint/no-explicit-any */
import * as AWSx from "aws-sdk";

const AWS = AWSx as any;

export function fetchAndParseDataFromEs(
    endpoint: AWS.Endpoint,
    region: string,
    index: string,
    path: string,
    fromISOString: string,
    toISOString: string,
): Promise<string> {
    return fetchDataFromEs(
        endpoint, region, index, path, fromISOString, toISOString,
    )
        .then(function(resultJsonObj) {
            return parseDataToString(resultJsonObj);
        });
}

export function fetchDataFromEs(
    endpoint: AWS.Endpoint,
    region: string,
    index: string,
    path: string,
    fromISOString: string,
    toISOString: string,
): Promise<ESResponse> {
    return new Promise((resolve, reject) => {
        const creds = new AWS.EnvironmentCredentials("AWS");
        const req = new AWS.HttpRequest(endpoint);
        const query = getQuery(fromISOString, toISOString);

        req.method = "POST";
        req.path = `/${index}/${path}`;
        req.region = region;
        req.headers.Host = endpoint.host;
        req.headers["Content-Type"] = "application/json";
        req.body = query;
        const signer = new AWS.Signers.V4(req, "es");
        signer.addAuthorization(creds, new Date());
        const send = new AWS.NodeHttpClient();
        console.log(`method=fetchDataFromEs `, JSON.stringify(req));
        send.handleRequest(req,
            null,
            function (httpResp: any) {
                let respBody = "";
                httpResp.on("data", function (chunk: string) {
                    respBody += chunk;
                });
                httpResp.on("end", function () {
                    resolve(JSON.parse(respBody));
                });
            },
            function (err: unknown) {
                console.error("Error: " + err);
                reject(err);
            });
    });
}

export function getQuery(fromISOString: string, toISOString: string) {
    const queryObj: any =
    {
        "query": {
            "bool": {
                "must": [
                    {
                        "query_string": {
                            "query": "logger_name:fi.livi.digitraffic.tie.service.v2.maintenance.V2MaintenanceTrackingUpdateService AND level:WARN",
                            "time_zone": "Europe/Oslo",
                        },
                    },
                ],
                "filter": [
                    {
                        "range": {
                            "@timestamp": {
                                "gte": fromISOString,
                                "lte": toISOString,
                                "format": "strict_date_optional_time",
                            },
                        },
                    },
                ],
                "should": [],
                "must_not": [],
            },
        },
    };
    return JSON.stringify(queryObj);
}

/**
 * Parse json messages from ES response to string
 * @param resultJsonObj Json object from elastic search
 */
export function parseDataToString(resultJsonObj: ESResponse): string {

    if (!('hits' in resultJsonObj) || !resultJsonObj.hits || !('hits' in resultJsonObj.hits)) {
        return "";
    }
    const hits = resultJsonObj.hits.hits;

    let messages = "";
    hits.forEach( function(hit : ESResponseHit) {
        if (messages.length > 0) {
            messages += '\n\n';
        }
        messages += hit._source.message;
    });
    console.info("method=parseDataToString Result length: ", messages.length);
    return messages;
}

export type ESResponse = {
    readonly hits: ESResponseHits
}

export type ESResponseHits = {
    readonly hits: ESResponseHit[]
}

export type ESResponseHit = {
    readonly _source: {
        readonly message: string
    }
}