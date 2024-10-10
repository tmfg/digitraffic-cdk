import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { setEnvVariable, setSecretOverideAwsRegionEnv } from "@digitraffic/common/dist/utils/utils";
import type {
    CloudFrontRequestEvent,
    CloudFrontRequestResult,
    CloudFrontResultResponse,
    Context,
    CloudFrontRequestHandler,
    CloudFrontRequestCallback,
    CloudFrontRequest
} from "aws-lambda";

import queryStringHelper, { type ParsedUrlQuery, type ParsedUrlQueryInput } from "querystring";
import { EnvKeys } from "@digitraffic/common/dist/aws/runtime/environment";
import { createAndLogError } from "../lambda-util.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

setEnvVariable(EnvKeys.SECRET_ID, "road");
// Set region for secret reading manually to eu-west-1 as edge lambda is in us-west-1 or "random" region at runtime
setSecretOverideAwsRegionEnv("eu-west-1");
const secretHolder = SecretHolder.create<LamSecrets>("tms-history");

export const PATHS = {
    HISTORY_RAW: "/api/tms/v1/history/raw/",
    HISTORY: "/ui/tms/history",
    HISTORY_v1: "/api/tms/v1/history"
} as const;

export const handler: CloudFrontRequestHandler = async (
    event: CloudFrontRequestEvent,
    _: Context,
    callback: CloudFrontRequestCallback
): Promise<CloudFrontRequestResult> => {
    const records = event.Records;
    if (records) {
        const record = records[0];
        if (!record) {
            const err = createAndLogError("lambda-lam-redirect.handler", "Records did not have a record");
            callback(err);
            throw err;
        }
        const request: CloudFrontRequest = record.cf.request;

        logger.info({
            method: "lambda-lam-redirect.handler",
            customUri: request.uri,
            customRequest: JSON.stringify(request),
            // eslint-disable-next-line dot-notation
            customRegion: process.env["AWS_REGION"],
            message: "Redirect called"
        });

        // This is for raw-data from ongoing or history S3 bucket. History-bucket has data until end of 2021
        // and ongoing-bucket has data from start of the 2022.
        if (request.uri.includes(PATHS.HISTORY_RAW)) {
            // Adjust uri i.e. /api/tms/v1/history/raw/lamraw_[lam_id]_[yearshort]_[day_number].csv -> /lamraw_[lam_id]_[yearshort]_[day_number].csv
            request.uri = request.uri.substring(request.uri.lastIndexOf("/"));

            const parts = request.uri.split("_");

            if (Array.isArray(parts) && parts.length > 2) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const year = parseInt(parts[2]!, 10);

                if (!isNaN(year) && year > 21) {
                    // Change origin
                    const secret = await secretHolder.get();
                    if (request.origin?.s3) {
                        request.origin.s3.domainName = secret.s3DomainTmsRawOngoing;
                    } else {
                        throw new Error("method=tmsHistoryHandler type=raw Empty request.origin.s3!");
                    }
                    // eslint-disable-next-line dot-notation
                    request.headers["host"] = [
                        {
                            key: "host",
                            value: secret.s3DomainTmsRawOngoing
                        }
                    ];
                }
            }

            logger.info({
                method: "lambda-lam-redirect.handler",
                type: "raw fix",
                customRequestUri: request.uri,
                // eslint-disable-next-line dot-notation
                customHost: JSON.stringify(request.headers["host"])
            });
            // This is for the SnowLake request and GET works with webpage address (/ui/tms/history) and with api-url.
            // Index.html has been set to do GET to /api/tms/v1/history. Without it, it will default to do get to webpage address.
        } else if (
            (request.uri.includes(PATHS.HISTORY) || request.uri.includes(PATHS.HISTORY_v1)) &&
            request.querystring.length
        ) {
            const newQuery = parseQuery(request.querystring);
            if (!newQuery.length) {
                throw new Error(
                    "method=tmsHistoryHandler Empty query string! querystring: " + request.querystring
                );
            }

            const secret: LamSecrets = await secretHolder.get();

            request.origin = {
                custom: {
                    domainName: secret.snowflakeDomain,
                    port: 443,
                    protocol: "https",
                    path: "/prod",
                    sslProtocols: ["TLSv1", "TLSv1.1"],
                    readTimeout: 20,
                    keepaliveTimeout: 5,
                    customHeaders: {
                        "x-api-key": [
                            {
                                key: "x-api-key",
                                value: secret.snowflakeApikey
                            }
                        ]
                    }
                }
            };

            // host is not allowed in CF custom headers
            // eslint-disable-next-line dot-notation
            request.headers["host"] = [{ key: "host", value: secret.snowflakeDomain }];

            request.uri = getApiPath(request.querystring);
            request.querystring = newQuery;
            logger.info({
                method: "lambda-lam-redirect.handler",
                message: "",
                type: "snowflake",
                customRequestUri: request.uri,
                // eslint-disable-next-line dot-notation
                customHost: JSON.stringify(request.headers["host"]),
                customQueryString: request.querystring
            });

            // Redirect /ui/tms/history and /ui/tms/history/index.html requests to root /ui/tms/history/.
            // Then other resources from the webpage are also found under the root.
        } else if (
            request.uri.endsWith("/ui/tms/history") ||
            request.uri.includes("/ui/tms/history/index.")
        ) {
            //Generate HTTP redirect response to a different landing page that is root.
            const redirectResponse: CloudFrontResultResponse = {
                status: "301",
                statusDescription: "Moved Permanently",
                headers: {
                    location: [
                        {
                            key: "Location",
                            value: "/ui/tms/history/"
                        }
                    ],
                    "cache-control": [
                        {
                            key: "Cache-Control",
                            value: "max-age=300"
                        }
                    ]
                }
            };

            logger.info({
                method: "lambda-lam-redirect.handler",
                message: "",
                type: "redirectToWebpage",
                customRequestUri: request.uri,
                // eslint-disable-next-line dot-notation
                customHost: JSON.stringify(request.headers["host"]),
                customQueryString: request.querystring,
                customResponseStatus: redirectResponse.status,
                // @ts-ignore
                customLocation: JSON.stringify(redirectResponse?.headers?.location)
            });
            callback(null, redirectResponse);
            return redirectResponse;
            // This is for the webpage and it's resources
        } else if (request.uri.includes("/ui/tms/history/")) {
            // Adjust uri path to match root of bucket
            if (request.uri.endsWith("/ui/tms/history/")) {
                request.uri = "/index.html";
            } else {
                // Adjust uri i.e. /ui/tms-history/index.html -> /index. or /ui/tms-history/ -> /
                request.uri = request.uri.substring(request.uri.lastIndexOf("/"));
            }

            logger.info({
                method: "lambda-lam-redirect.handler",
                message: "",
                type: "webpage",
                customRequestUri: request.uri,
                // eslint-disable-next-line dot-notation
                customHost: JSON.stringify(request.headers["host"])
            });
        }

        logger.info({
            method: "lambda-lam-redirect.handler",
            message: `Return request ${JSON.stringify(request)}`
        });

        callback(null, request);
        return request;
    } else {
        const err = createAndLogError("lambda-lam-redirect.handler", "Event did not have records");
        callback(err);
        throw err;
    }
};

interface LamSecrets extends GenericSecret {
    snowflakeApikey: string;
    s3DomainTmsRawOngoing: string; // Data from year 2022 onwards
    s3DomainTmsRawHistory: string; // Data before year 2022
    snowflakeDomain: string;
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
    // eslint-disable-next-line dot-notation
    const api = queryStringHelper.parse(query)["api"];
    if (typeof api === "string") {
        return `/${api}`;
    }
    throw new Error(
        `method=tmsHistoryHandler.getApiPath api not a string: ${api?.toString() ?? "undefined"}`
    );
}

function parseQuery(query: string): string {
    if (query.length === 0) {
        return "";
    }

    const q = queryStringHelper.parse(query) as QueryParams;

    if (!q.api || !q.tyyppi || (!q.piste && !q.pistejoukko) || (!q.pvm && !q.viikko)) {
        logger.warn({
            method: "lambda-lam-redirect.parseQuery",
            message: `invalid input: missing items. Should have api, tyyppi, piste|pistejoukko, pvm|viikko. Was: ${JSON.stringify(q)}`
        });
        return "";
    }

    const resp: ResponseParams = { tyyppi: q.tyyppi };

    if (q.pvm) {
        resp.pvm = q.pvm;
    } else if (q.viikko) {
        resp.viikko = q.viikko;
    } else {
        logger.warn({
            method: "lambda-lam-redirect.parseQuery",
            message: "Invalid input: no date"
        });
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
        logger.warn({
            method: "lambda-lam-redirect.parseQuery",
            message: "Invalid input: no piste/pistejoukko"
        });
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
            logger.warn({
                method: "lambda-lam-redirect.parseQuery",
                message: "Invalid input: luokka is valid only with h-tyyppi"
            });
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
