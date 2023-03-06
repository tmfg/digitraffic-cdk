import { SecretsManager } from "aws-sdk";
import queryStringHelper, {
    ParsedUrlQuery,
    ParsedUrlQueryInput,
} from "querystring";

type GenericSecret = Record<string, string>;

// Set region manually to eu-west-1 (edge lambda is us-west-1)
const smClient = new SecretsManager({
    region: "eu-west-1",
});

exports.handler = async (event: any, context: any, callback: any) => {
    const { request } = event.Records[0].cf;

    console.log(
        "method=tmsHistoryHandler request.uri: %s, request: %o, region: %s",
        request.uri,
        request,
        process.env.AWS_REGION
    );

    // This is for raw-data from ongoing or history S3 bucket. History-bucket has data until end of 2021
    // and ongoing-bucket has data from start of the 2022.
    if (request.uri.includes("/api/tms/v1/history/raw/")) {
        // Adjust uri i.e. /api/tms/v1/history/raw/lamraw_[lam_id]_[yearshort]_[day_number].csv -> /lamraw_[lam_id]_[yearshort]_[day_number].csv
        request.uri = request.uri.substring(request.uri.lastIndexOf("/"));

        const parts = request.uri.split("_");

        if (Array.isArray(parts) && parts.length > 2) {
            const year = parseInt(parts[2], 10);

            if (!isNaN(year) && year > 21) {
                // Change origin
                let s3DomainLamRaw = (
                    await getSecret<LamSecrets>("road", "tms-history")
                ).s3DomainTmsRawOngoing;
                request.origin.s3.domainName = s3DomainLamRaw;
                request.headers["host"] = [
                    { key: "host", value: s3DomainLamRaw },
                ];
            }
        }

        console.log(
            "method=tmsHistoryHandler type=raw fix request uri=%s, host=%o",
            request.uri,
            request.headers["host"]
        );
        // This is for the SnowLake request and GET works with webpage address (/ui/tms/history) and with api-url.
        // Index.html has been set to do GET to /api/tms/v1/history. Without it, it will default to do get to webpage address.
    } else if (
        (request.uri.includes("/ui/tms/history") ||
            request.uri.includes("/api/tms/v1/history")) &&
        request.querystring.length
    ) {
        const newQuery = parseQuery(request.querystring);
        if (!newQuery.length) {
            throw new Error(
                "Empty query string! querystring: " + request.querystring
            );
        }
        // To snowflake
        const apikey = (await getSecret<LamSecrets>("road", "tms-history"))
            .apikey;

        const snowflakeDomain = (
            await getSecret<LamSecrets>("road", "tms-history")
        ).snowflakeDomain;

        request.origin = {
            custom: {
                domainName: snowflakeDomain,
                port: 443,
                protocol: "https",
                path: "/prod",
                sslProtocols: ["TLSv1", "TLSv1.1"],
                readTimeout: 20,
                keepaliveTimeout: 5,
                customHeaders: {
                    "x-api-key": [{ key: "x-api-key", value: apikey }],
                },
            },
        };

        // host is not allowed in CF custom headers
        request.headers["host"] = [{ key: "host", value: snowflakeDomain }];

        request.uri = getApiPath(request.querystring);
        request.querystring = newQuery;
        console.log(
            "method=tmsHistoryHandler type=snowflake request uri=%s, host=%o",
            request.uri,
            request.headers["host"]
        );

        // Redirect /ui/tms/history and /ui/tms/history/index.html requests to root /ui/tms/history/.
        // Then other resources from the webpage are also found under the root.
    } else if (
        request.uri.endsWith("/ui/tms/history") ||
        request.uri.includes("/ui/tms/history/index.")
    ) {
        //Generate HTTP redirect response to a different landing page that is root.
        const redirectResponse = {
            status: "301",
            statusDescription: "Moved Permanently",
            headers: {
                location: [
                    {
                        key: "Location",
                        value: "/ui/tms/history/",
                    },
                ],
                "cache-control": [
                    {
                        key: "Cache-Control",
                        value: "max-age=300",
                    },
                ],
            },
        };

        console.log(
            "method=tmsHistoryHandler type=redirectToWebpage request uri=%s, host=%o response status: %s location: %s",
            request.uri,
            request.headers["host"],
            redirectResponse.status,
            JSON.stringify(redirectResponse.headers.location)
        );
        callback(null, redirectResponse);
        // This is for the webpage and it's resources
    } else if (request.uri.includes("/ui/tms/history/")) {
        // Adjust uri path to match root of bucket
        if (request.uri.endsWith("/ui/tms/history/")) {
            request.uri = "/index.html";
        } else {
            // Adjust uri i.e. /ui/tms-history/index.html -> /index. or /ui/tms-history/ -> /
            request.uri = request.uri.substring(request.uri.lastIndexOf("/"));
        }

        console.log(
            "method=tmsHistoryHandler type=webpage request uri=%s, host=%o",
            request.uri,
            request.headers["host"]
        );
    }

    // If nothing matches, return request unchanged
    callback(null, request);
};

interface LamSecrets {
    apikey: string;
    s3DomainTmsRawOngoing: string; // Data from year 2022 onwards
    s3DomainTmsRawHistory: string; // Data before year 2022
    snowflakeDomain: string;
}

async function getSecret<LamSecrets>(
    secretId: string,
    prefix = ""
): Promise<LamSecrets> {
    const secretObj = await smClient
        .getSecretValue({
            SecretId: secretId,
        })
        .promise();

    if (!secretObj.SecretString) {
        throw new Error("No secret found!");
    }

    const secret = JSON.parse(secretObj.SecretString);

    if (prefix === "") {
        return secret;
    }

    return parseSecret(secret, `${prefix}.`);
}

function parseSecret<LamSecrets>(
    secret: GenericSecret,
    prefix: string
): LamSecrets {
    const parsed: GenericSecret = {};
    const skip = prefix.length;

    for (const key in secret) {
        if (key.startsWith(prefix)) {
            parsed[key.substring(skip)] = secret[key];
        }
    }

    return parsed as unknown as LamSecrets;
}

interface QueryParams extends ParsedUrlQuery {
    api: string;
    tyyppi: string;
    pvm?: string;
    viikko?: string;
    loppu?: string;
    piste?: string;
    pistejoukko?: string;
    suunta?: string | string[];
    sisallytakaistat?: string;
    ryhma?: string | string[];
    luokka?: string | string[];
}

interface ResponseParams extends ParsedUrlQueryInput {
    tyyppi: string;
    pvm?: string;
    viikko?: string;
    piste?: string;
    pistejoukko?: string;
    suunta?: string;
    sisallytakaistat?: string;
    ryhma?: string;
    ajoneuvoluokka?: string;
}

function getApiPath(query: string): string {
    return "/" + queryStringHelper.parse(query).api;
}

function parseQuery(query: string): string {
    if (query.length == 0) {
        return "";
    }

    const q = queryStringHelper.parse(query) as QueryParams;

    if (
        !q.api ||
        !q.tyyppi ||
        (!q.piste && !q.pistejoukko) ||
        (!q.pvm && !q.viikko)
    ) {
        console.log(
            "method=tmsHistoryHandler.parseQuery invalid input: missing items"
        );
        return "";
    }

    const resp: ResponseParams = { tyyppi: q.tyyppi };

    if (q.pvm) {
        resp.pvm = q.pvm;
    } else if (q.viikko) {
        resp.viikko = q.viikko;
    } else {
        console.log(
            "method=tmsHistoryHandler.parseQuery invalid input: no date"
        );
        return "";
    }

    if (q.loppu) {
        if (q.pvm) {
            resp.pvm += "-" + q.loppu;
        } else {
            resp.viikko += "-" + q.loppu;
        }
    }

    if (q.piste) {
        resp.piste = q.piste;
    } else if (q.pistejoukko) {
        resp.pistejoukko = q.pistejoukko;
    } else {
        console.log(
            "method=tmsHistoryHandler.parseQuery invalid input: no piste/pistejoukko"
        );
        return "";
    }

    if (q.suunta) {
        resp.suunta = getValue(q.suunta, "-");
    }

    if (q.sisallytakaistat) {
        resp.sisallytakaistat = q.sisallytakaistat;
    }

    if (q.ryhma) {
        resp.ryhma = getValue(q.ryhma);
    } else if (q.luokka) {
        if (q.tyyppi !== "h") {
            console.log(
                "method=tmsHistoryHandler.parseQuery invalid input: luokka is valid only with h-tyyppi"
            );
            return "";
        }

        resp.ajoneuvoluokka = getValue(q.luokka);
    }

    // Example query tyyppi=h&piste=730&pvm=2021-09-09
    return queryStringHelper.stringify(resp);
}

function getValue(input: string | string[], delimiter: string = ","): string {
    return Array.isArray(input) ? input.join(delimiter) : input;
}
