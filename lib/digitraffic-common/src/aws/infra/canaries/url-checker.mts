import { IncomingMessage, type RequestOptions } from "http";
import { Asserter } from "../../../test/asserter.mjs";

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
import synthetics from "Synthetics";
import zlib from "zlib";
import { MediaType } from "../../types/mediatypes.mjs";
import { getApiKeyFromAPIGateway } from "../../runtime/apikey.mjs";
import type { FeatureCollection } from "geojson";
import { isValidGeoJson } from "../../../utils/geometry.mjs";
import { getEnvVariable } from "../../../utils/utils.mjs";
import { ENV_API_KEY, ENV_HOSTNAME } from "./canary-keys.mjs";
import { logger } from "../../runtime/dt-logger-default.mjs";
import { logException } from "../../../utils/logging.mjs";

export const API_KEY_HEADER = "x-api-key";

const baseHeaders = {
    "Digitraffic-User": "internal-digitraffic-canary",
    "Accept-Encoding": "gzip",
    Accept: "*/*",
} as Record<string, string>;

type CheckerFunction = (Res: IncomingMessage) => Promise<void>;
type JsonCheckerFunction<T> = (
    json: T,
    body: string,
    message: IncomingMessage
) => Promise<void>;

export class UrlChecker {
    private readonly requestOptions: RequestOptions;

    constructor(hostname: string, apiKey?: string) {
        const headers = { ...baseHeaders };

        if (apiKey) {
            headers[API_KEY_HEADER] = apiKey;
        }

        this.requestOptions = {
            hostname,
            method: "GET",
            protocol: "https:",
            headers,
        };

        synthetics.getConfiguration().disableRequestMetrics();

        synthetics
            .getConfiguration()
            .withIncludeRequestBody(false)
            .withIncludeRequestHeaders(false)
            .withIncludeResponseBody(false)
            .withIncludeResponseHeaders(false)
            .withFailedCanaryMetric(true);
    }

    static async create(hostname: string, apiKeyId: string): Promise<UrlChecker> {
        const apiKey = await getApiKeyFromAPIGateway(apiKeyId);

        return new UrlChecker(hostname, apiKey.value);
    }

    static createV2(): Promise<UrlChecker> {
        return this.create(
            getEnvVariable(ENV_HOSTNAME),
            getEnvVariable(ENV_API_KEY)
        );
    }

    expectStatus<T>(
        statusCode: number,
        url: string,
        callback: JsonCheckerFunction<T>
    ): Promise<void> {
        const requestOptions = {
            ...this.requestOptions,
            ...{
                path: url,
            },
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
        return synthetics.executeHttpStep(
            `Verify ${statusCode} for ${url.replace(/auth=.*/, "")}`,
            requestOptions,
            callback
        );
    }

    expect200<T>(
        url: string,
        ...callbacks: JsonCheckerFunction<T>[]
    ): Promise<void> {
        const callback = async (
            json: T,
            body: string,
            res: IncomingMessage
        ) => {
            await Promise.allSettled(callbacks.map((c) => c(json, body, res)));
        };

        return this.expectStatus(200, url, callback);
    }

    expect404(url: string): Promise<void> {
        const requestOptions = {
            ...this.requestOptions,
            ...{
                path: url,
            },
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
        return synthetics.executeHttpStep(
            `Verify 404 for ${url}`,
            requestOptions,
            validateStatusCodeAndContentType(404, MediaType.TEXT_PLAIN)
        );
    }

    expect400(url: string): Promise<void> {
        const requestOptions = {
            ...this.requestOptions,
            ...{
                path: url,
            },
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
        return synthetics.executeHttpStep(
            `Verify 400 for ${url}`,
            requestOptions,
            validateStatusCodeAndContentType(400, MediaType.TEXT_PLAIN)
        );
    }

    expect403WithoutApiKey(url: string, mediaType?: MediaType): Promise<void> {
        if (
            // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
            !this.requestOptions.headers ||
            !this.requestOptions.headers[API_KEY_HEADER]
        ) {
            logger.error({
                method: "UrlChecker.expect403WithoutApiKey",
                message: "No Api-key defined",
            });
        }

        const requestOptions = {
            ...this.requestOptions,
            ...{
                path: url,
                headers: baseHeaders,
            },
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
        return synthetics.executeHttpStep(
            `Verify 403 for ${url}`,
            requestOptions,
            validateStatusCodeAndContentType(
                403,
                mediaType ?? MediaType.APPLICATION_JSON
            )
        );
    }

    done(): string {
        return "Canary successful";
    }
}

async function getResponseBody(response: IncomingMessage): Promise<string> {
    const body = await getBodyFromResponse(response);

    if (response.headers["content-encoding"] === "gzip") {
        try {
            return zlib.gunzipSync(body).toString();
        } catch (e) {
            logException(logger, e);
        }
    }

    return body.toString();
}

function getBodyFromResponse(response: IncomingMessage): Promise<string> {
    return new Promise((resolve: (value: string) => void) => {
        const buffers: Buffer[] = [];

        response.on("data", (data: Buffer) => {
            buffers.push(data);
        });

        response.on("end", () => {
            resolve(Buffer.concat(buffers).toString());
        });
    });
}

/**
 * Returns function, that validates that the status code and content-type from response are the given values
 * @param statusCode
 * @param contentType
 */
function validateStatusCodeAndContentType(
    statusCode: number,
    contentType: MediaType
): (Res: IncomingMessage) => Promise<void> {
    return (res: IncomingMessage) => {
        return new Promise((resolve) => {
            if (res.statusCode !== statusCode) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                throw new Error(`${res.statusCode!} ${res.statusMessage!}`);
            }

            if (res.headers["content-type"] !== contentType) {
                throw new Error(
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    `Wrong content-type ${res.headers["content-type"]!}`
                );
            }

            resolve();
        });
    };
}

// DEPRECATED
export class ResponseChecker {
    private readonly contentType;
    private checkCors = true;

    constructor(contentType: string) {
        this.contentType = contentType;
    }

    static forJson(): ResponseChecker {
        return new ResponseChecker(MediaType.APPLICATION_JSON);
    }

    static forCSV(): ResponseChecker {
        return new ResponseChecker(MediaType.TEXT_CSV);
    }

    static forGeojson(): ResponseChecker {
        return new ResponseChecker(MediaType.APPLICATION_GEOJSON);
    }

    static forJpeg(): ResponseChecker {
        return new ResponseChecker(MediaType.IMAGE_JPEG);
    }

    check(): CheckerFunction {
        return this.responseChecker(() => {
            // no need to do anything
        });
    }

    checkJson<T>(
        fn: (json: T, body: string, res: IncomingMessage) => void
    ): CheckerFunction {
        return this.responseChecker((body: string, res: IncomingMessage) => {
            fn(JSON.parse(body) as unknown as T, body, res);
        });
    }

    responseChecker(
        fn: (body: string, res: IncomingMessage) => void
    ): CheckerFunction {
        return async (res: IncomingMessage): Promise<void> => {
            if (!res.statusCode) {
                throw new Error("statusCode missing");
            }

            if (res.statusCode < 200 || res.statusCode > 299) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                throw new Error(`${res.statusCode} ${res.statusMessage!}`);
            }

            if (this.checkCors && !res.headers["access-control-allow-origin"]) {
                throw new Error("CORS missing");
            }

            if (res.headers["content-type"] !== this.contentType) {
                throw new Error(
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    `Wrong content-type ${res.headers["content-type"]!}`
                );
            }

            const body = await getResponseBody(res);

            fn(body, res);
        };
    }
}

export class ContentChecker {
    static checkJson<T>(
        fn: (json: T, body: string, res: IncomingMessage) => void
    ): CheckerFunction {
        return async (res: IncomingMessage): Promise<void> => {
            const body = await getResponseBody(res);

            fn(JSON.parse(body) as unknown as T, body, res);
        };
    }

    static checkResponse(
        fn: (body: string, res: IncomingMessage) => void
    ): CheckerFunction {
        return async (res: IncomingMessage): Promise<void> => {
            const body = await getResponseBody(res);

            fn(body, res);
        };
    }
}

export class ContentTypeChecker {
    static checkContentType(contentType: MediaType): CheckerFunction {
        return (res: IncomingMessage) => {
            if (!res.statusCode) {
                throw new Error("statusCode missing");
            }

            if (res.statusCode < 200 || res.statusCode > 299) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                throw new Error(`${res.statusCode} ${res.statusMessage!}`);
            }

            if (!res.headers["access-control-allow-origin"]) {
                throw new Error("CORS missing");
            }

            if (res.headers["content-type"] !== contentType) {
                throw new Error(
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    `Wrong content-type ${res.headers["content-type"]!}`
                );
            }

            return Promise.resolve();
        };
    }
}

export class GeoJsonChecker {
    static validFeatureCollection(
        fn?: (json: FeatureCollection) => void
    ): CheckerFunction {
        return ResponseChecker.forGeojson().checkJson(
            (json: FeatureCollection) => {
                Asserter.assertEquals(json.type, "FeatureCollection");
                Asserter.assertTrue(isValidGeoJson(json));

                if (fn) {
                    fn(json);
                }
            }
        );
    }
}

export class HeaderChecker {
    static checkHeaderExists(headerName: string): CheckerFunction {
        return (res: IncomingMessage) => {
            if (!res.headers[headerName]) {
                throw new Error("Missing header: " + headerName);
            }

            return Promise.resolve();
        };
    }

    static checkHeaderMissing(headerName: string): CheckerFunction {
        return (res: IncomingMessage) => {
            if (res.headers[headerName]) {
                throw new Error("Header should not exist: " + headerName);
            }

            return Promise.resolve();
        };
    }
}
