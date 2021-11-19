import {MediaType} from "../api/mediatypes";
import {getApiKeyFromAPIGateway} from "../api/apikey";
import {constants} from "http2";

const synthetics = require('Synthetics');
import zlib = require('zlib');

const baseHeaders = {
    "Digitraffic-User" : "AWS Canary",
    "Accept-Encoding" : "gzip",
    "Accept": [MediaType.TEXT_HTML, MediaType.APPLICATION_JSON].join(',')
} as Record<string, string>;

const API_KEY_HEADER = "x-api-key";

const OK_RESOLUTION = "OK";

export class UrlChecker {
    private readonly requestOptions: any;

    constructor(hostname: string, apiKey?: string) {
        const headers = {...baseHeaders};

        if (apiKey) {
            headers[API_KEY_HEADER] = apiKey;
        }

        this.requestOptions = {
            hostname,
            method: 'GET',
            protocol: 'https:',
            headers: headers
        } as any;

        synthetics.getConfiguration()
            .disableRequestMetrics();

        synthetics.getConfiguration()
            .withIncludeRequestBody(false)
            .withIncludeRequestHeaders(false)
            .withIncludeResponseBody(false)
            .withIncludeResponseHeaders(false)
            .withFailedCanaryMetric(true);
    }

    static async create(hostname: string, apiKeyId: string) {
        const apiKey = await getApiKeyFromAPIGateway(apiKeyId);

        return new UrlChecker(hostname, apiKey.value);
    }

    async expect200(url: string, callback?: any): Promise<any> {
        const requestOptions = {...this.requestOptions, ...{
            path: url
        }};

        await synthetics.executeHttpStep("Verify 200 for " + url, requestOptions, callback);
    }

    async expect404(url: string): Promise<any> {
        const requestOptions = {...this.requestOptions, ...{
                path: url
            }};

        await synthetics.executeHttpStep("Verify 404 for " + url, requestOptions, validateStatusCodeAndContentType(404, MediaType.TEXT_PLAIN));
    }

    async expect403WithoutApiKey(url: string, mediaType?: MediaType): Promise<any> {
        const requestOptions = {...this.requestOptions, ...{
            path: url,
            headers: baseHeaders
        }};

        await synthetics.executeHttpStep("Verify 403 for " + url,
            requestOptions,
            validateStatusCodeAndContentType(403, mediaType ?? MediaType.TEXT_PLAIN));
    }

    async done(): Promise<string> {
        return "Canary successful";
   }
}

export function jsonChecker(fn: any): any {
    return responseChecker((body: string) => {
        fn(JSON.parse(body), body);
    });
}

export function responseChecker(fn: any): any {
    return async (res: any) => {
        if (res.statusCode < 200 || res.statusCode > 299) {
            throw res.statusCode + ' ' + res.statusMessage;
        }

        const body = await getResponseBody(res);

        fn(body);
    };
}

async function getResponseBody(response: any): Promise<string> {
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

function getBodyFromResponse(response: any): Promise<string> {
    return new Promise((resolve: any) => {
        const buffers: Buffer[] = [];

        response.on('data', (data: any) => {
            buffers.push(data);
        });

        response.on('end', () => {
            resolve(Buffer.concat(buffers));
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
function validateStatusCodeAndContentType(statusCode: number, contentType: MediaType) {
    return async (res: any) => {
        return new Promise(resolve => {
            if (res.statusCode !== statusCode) {
                throw `${res.statusCode} ${res.statusMessage}`;
            }

            if(res.headers[constants.HTTP2_HEADER_CONTENT_TYPE] !== contentType) {
                throw 'Wrong content-type ' + res.headers[constants.HTTP2_HEADER_CONTENT_TYPE];
            }

            resolve(OK_RESOLUTION);
        });
    };
}

export class ResponseChecker {
    private readonly contentType;
    private checkCors = true;

    constructor(contentType: string) {
        this.contentType = contentType;
    }

    static forJson() {
        return new ResponseChecker(MediaType.APPLICATION_JSON);
    }

    static forGeojson() {
        return new ResponseChecker(MediaType.APPLICATION_GEOJSON);
    }

    noCors(): ResponseChecker {
        this.checkCors = false;

        return this;
    }

    checkJson(fn: any): any {
        return this.responseChecker((body: string) => {
            fn(JSON.parse(body), body);
        });
    }

    responseChecker(fn: any): any {
        return async (res: any) => {
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
