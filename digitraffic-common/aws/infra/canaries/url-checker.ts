import {constants} from "http2";
import {IncomingMessage, RequestOptions} from "http";
import * as Assert from "digitraffic-common/test/asserter";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const synthetics = require('Synthetics');
import zlib = require('zlib');
import {MediaType} from "../../types/mediatypes";
import {getApiKeyFromAPIGateway} from "../../runtime/apikey";
import {FeatureCollection} from "geojson";
import {isValidGeoJson} from "../../../utils/geometry";

export const API_KEY_HEADER = "x-api-key";

const baseHeaders = {
    "Digitraffic-User" : "Digitraffic/AWS Canary",
    "Accept-Encoding" : "gzip",
    "Accept": "*/*",
} as Record<string, string>;

type CheckerFunction = (Res: IncomingMessage) => void;
type JsonCheckerFunction<T> = (json: T, body: string, message: IncomingMessage) => void;

export class UrlChecker {
    private readonly requestOptions: RequestOptions;

    constructor(hostname: string, apiKey?: string) {
        const headers = {...baseHeaders};

        if (apiKey) {
            headers[API_KEY_HEADER] = apiKey;
        }

        this.requestOptions = {
            hostname,
            method: 'GET',
            protocol: 'https:',
            headers,
        };

        synthetics.getConfiguration()
            .disableRequestMetrics();

        synthetics.getConfiguration()
            .withIncludeRequestBody(false)
            .withIncludeRequestHeaders(false)
            .withIncludeResponseBody(false)
            .withIncludeResponseHeaders(false)
            .withFailedCanaryMetric(true);
    }

    static create(hostname: string, apiKeyId: string): Promise<UrlChecker> {
        return getApiKeyFromAPIGateway(apiKeyId).then(apiKey => {
            return new UrlChecker(hostname, apiKey.value);
        });
    }

    static createV2(): Promise<UrlChecker> {
        return this.create(process.env.hostname as string, process.env.apiKeyId as string);
    }

    expectStatus<T>(statusCode: number, url: string, callback: JsonCheckerFunction<T>): Promise<void> {
        const requestOptions = {...this.requestOptions, ...{
            path: url,
        }};

        return synthetics.executeHttpStep("Verify " + statusCode + "  for " + url.replace(/auth=.*/, ''),
            requestOptions,
            callback);
    }

    expect200<T>(url: string, ...callbacks: JsonCheckerFunction<T>[]): Promise<void> {
        const callback = async (json: T, body: string, res: IncomingMessage) => {
            await Promise.allSettled(callbacks.map(c => c(json, body, res)));
        };

        return this.expectStatus(200, url, callback);
    }

    expect404(url: string): Promise<void> {
        const requestOptions = {...this.requestOptions, ...{
            path: url,
        }};

        return synthetics.executeHttpStep("Verify 404 for " + url, requestOptions, validateStatusCodeAndContentType(404, MediaType.TEXT_PLAIN));
    }

    expect403WithoutApiKey(url: string, mediaType?: MediaType): Promise<void> {
        if (!this.requestOptions.headers || !this.requestOptions.headers[API_KEY_HEADER]) {
            console.error("No api key defined");
        }

        const requestOptions = {...this.requestOptions, ...{
            path: url,
            headers: baseHeaders,
        }};

        return synthetics.executeHttpStep("Verify 403 for " + url,
            requestOptions,
            validateStatusCodeAndContentType(403, mediaType || MediaType.APPLICATION_JSON));
    }

    done(): string {
        return "Canary successful";
    }
}

async function getResponseBody(response: IncomingMessage): Promise<string> {
    const body = await getBodyFromResponse(response);

    if (response.headers[constants.HTTP2_HEADER_CONTENT_ENCODING] === 'gzip') {
        try {
            return zlib.gunzipSync(body).toString();
        } catch (e) {
            console.info("error " + JSON.stringify(e));
        }
    }

    return body.toString();
}

function getBodyFromResponse(response: IncomingMessage): Promise<string> {
    return new Promise((resolve: ((value: string) => void)) => {
        const buffers: Buffer[] = [];

        response.on('data', (data: Buffer) => {
            buffers.push(data);
        });

        response.on('end', () => {
            resolve(Buffer.concat(buffers).toString());
        });
    });
}

/**
 * Returns function, that validates that the status code and content-type from response are the given values
 * @param statusCode
 * @param contentType
 */
function validateStatusCodeAndContentType(statusCode: number, contentType: MediaType): (Res: IncomingMessage) => Promise<void> {
    return (res: IncomingMessage) => {
        return new Promise(resolve => {
            if (res.statusCode !== statusCode) {
                throw new Error(`${res.statusCode} ${res.statusMessage}`);
            }

            if (res.headers[constants.HTTP2_HEADER_CONTENT_TYPE] !== contentType) {
                throw new Error('Wrong content-type ' + res.headers[constants.HTTP2_HEADER_CONTENT_TYPE]);
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

    checkJson<T>(fn: (json: T, body: string, res: IncomingMessage) => void): CheckerFunction {
        return this.responseChecker((body: string, res: IncomingMessage) => {
            fn(JSON.parse(body), body, res);
        });
    }

    responseChecker(fn: (body: string, res: IncomingMessage) => void): CheckerFunction {
        return async (res: IncomingMessage): Promise<void> => {
            if (!res.statusCode) {
                throw new Error('statusCode missing');
            }

            if (res.statusCode < 200 || res.statusCode > 299) {
                throw new Error(res.statusCode + ' ' + res.statusMessage);
            }

            if (this.checkCors && !res.headers[constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN]) {
                throw new Error('CORS missing');
            }

            if (res.headers[constants.HTTP2_HEADER_CONTENT_TYPE] !== this.contentType) {
                throw new Error('Wrong content-type ' + res.headers[constants.HTTP2_HEADER_CONTENT_TYPE]);
            }

            const body = await getResponseBody(res);

            fn(body, res);
        };
    }
}

export class ContentChecker {
    static checkJson<T>(fn: (json: T, body: string, res: IncomingMessage) => void): CheckerFunction {
        return async (res: IncomingMessage): Promise<void> => {
            const body = await getResponseBody(res);

            fn(JSON.parse(body), body, res);
        };
    }

    static checkResponse(fn: (body: string, res: IncomingMessage) => void): CheckerFunction {
        return async (res: IncomingMessage): Promise<void> => {
            const body = await getResponseBody(res);

            fn(body, res);
        };
    }
}

export class ContentTypeChecker {
    static checkContentType(contentType: MediaType) {
        return (res: IncomingMessage) => {
            if (!res.statusCode) {
                throw new Error('statusCode missing');
            }

            if (res.statusCode < 200 || res.statusCode > 299) {
                throw new Error(res.statusCode + ' ' + res.statusMessage);
            }

            if (!res.headers[constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN]) {
                throw new Error('CORS missing');
            }

            if (res.headers[constants.HTTP2_HEADER_CONTENT_TYPE] !== contentType) {
                throw new Error('Wrong content-type ' + res.headers[constants.HTTP2_HEADER_CONTENT_TYPE]);
            }
        };
    }
}

export class GeoJsonChecker {
    static validFeatureCollection(fn?: (json: FeatureCollection) => void): CheckerFunction {
        return ResponseChecker.forGeojson().checkJson((json: FeatureCollection) => {
            Assert.assertEquals(json.type, 'FeatureCollection');
            Assert.assertTrue(isValidGeoJson(json));

            if (fn) {
                fn(json);
            }
        });
    }
}

export class HeaderChecker {
    static checkHeaderExists(headerName: string): CheckerFunction {
        return (res: IncomingMessage) => {
            if (!res.headers[headerName]) {
                throw new Error('Missing header: ' + headerName);
            }
        };
    }

    static checkHeaderMissing(headerName: string): CheckerFunction {
        return (res: IncomingMessage) => {
            if (res.headers[headerName]) {
                throw new Error('Header should not exist: ' + headerName);
            }
        };
    }
}
