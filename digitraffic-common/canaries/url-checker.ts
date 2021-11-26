import {MediaType} from "../api/mediatypes";
import {getApiKeyFromAPIGateway} from "../api/apikey";
import {constants} from "http2";
import {IncomingMessage, RequestOptions} from "http";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const synthetics = require('Synthetics');
import zlib = require('zlib');

export const API_KEY_HEADER = "x-api-key";

const baseHeaders = {
    "Digitraffic-User" : "Digitraffic/AWS Canary",
    "Accept-Encoding" : "gzip",
    "Accept": "*/*"
} as Record<string, string>;

type CheckerFunction = (Res: IncomingMessage) => void;
type JsonCheckerFunction<T> = (json: T, body: string) => void;

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

    expect200<T>(url: string, callback?: JsonCheckerFunction<T>): Promise<void> {
        const requestOptions = {...this.requestOptions, ...{
            path: url
        }};

        return synthetics.executeHttpStep("Verify 200 for " + url, requestOptions, callback);
    }

    expect404(url: string): Promise<void> {
        const requestOptions = {...this.requestOptions, ...{
                path: url
            }};

        return synthetics.executeHttpStep("Verify 404 for " + url, requestOptions, validateStatusCodeAndContentType(404, MediaType.TEXT_PLAIN));
    }

    expect403WithoutApiKey(url: string, mediaType?: MediaType): Promise<void> {
        if(!this.requestOptions.headers || !this.requestOptions.headers[API_KEY_HEADER]) {
            console.error("No api key defined");
        }

        const requestOptions = {...this.requestOptions, ...{
            path: url,
            headers: baseHeaders
        }};

        return synthetics.executeHttpStep("Verify 403 for " + url,
            requestOptions,
            validateStatusCodeAndContentType(403, mediaType ?? MediaType.APPLICATION_JSON));
    }

    done(): string {
        return "Canary successful";
   }
}

export function jsonChecker<T>(fn: JsonCheckerFunction<T>): CheckerFunction {
    return responseChecker((body: string) => {
        fn(JSON.parse(body), body);
    });
}

export function responseChecker(fn: (body: string) => void): CheckerFunction {
    return async (res: IncomingMessage) => {
        if(!res.statusCode) {
            throw 'statusCode missing';
        }

        if (res.statusCode < 200 || res.statusCode > 299) {
            throw res.statusCode + ' ' + res.statusMessage;
        }

        const body = await getResponseBody(res);

        fn(body);
    };
}

async function getResponseBody(response: IncomingMessage): Promise<string> {
    const body = await getBodyFromResponse(response);

    if(response.headers[constants.HTTP2_HEADER_CONTENT_ENCODING] === 'gzip') {
        try {
            return zlib.gunzipSync(body).toString();
        } catch(e) {
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

export function mustContain(body: string, text: string) {
    console.info("checking " + body);

    if(!body.includes(text)) {
        console.info("Did not contain " + text);
        throw "Did not contain " + text;
    }
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
                throw `${res.statusCode} ${res.statusMessage}`;
            }

            if(res.headers[constants.HTTP2_HEADER_CONTENT_TYPE] !== contentType) {
                throw 'Wrong content-type ' + res.headers[constants.HTTP2_HEADER_CONTENT_TYPE];
            }

            resolve();
        });
    };
}

export class ResponseChecker {
    private readonly contentType;
    private checkCors = true;

    constructor(contentType: string) {
        this.contentType = contentType;
    }

    static forJson(): ResponseChecker {
        return new ResponseChecker(MediaType.APPLICATION_JSON);
    }

    static forGeojson(): ResponseChecker {
        return new ResponseChecker(MediaType.APPLICATION_GEOJSON);
    }

    static forJpeg(): ResponseChecker {
        return new ResponseChecker(MediaType.IMAGE_JPEG);
    }

    noCors(): ResponseChecker {
        this.checkCors = false;

        return this;
    }

    check(): CheckerFunction {
        return this.responseChecker(() => {
            // no need to do anything
        });
    }

    checkJson<T>(fn: (json: T, body: string) => void): CheckerFunction {
        return this.responseChecker((body: string) => {
            fn(JSON.parse(body), body);
        });
    }

    responseChecker(fn: (body: string) => void): CheckerFunction {
        return async (res: IncomingMessage): Promise<void> => {
            if (!res.statusCode) {
                throw 'statusCode missing';
            }

            if (res.statusCode < 200 || res.statusCode > 299) {
                throw res.statusCode + ' ' + res.statusMessage;
            }

            if(this.checkCors && !res.headers[constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN]) {
                throw 'CORS missing';
            }

            if(res.headers[constants.HTTP2_HEADER_CONTENT_TYPE] !== this.contentType) {
                throw 'Wrong content-type ' + res.headers[constants.HTTP2_HEADER_CONTENT_TYPE];
            }

            const body = await getResponseBody(res);

            fn(body);
        };
    }
}
