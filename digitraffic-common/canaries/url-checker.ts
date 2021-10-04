import {MediaType} from "../api/mediatypes";

const synthetics = require('Synthetics');
const zlib = require('zlib');

const baseHeaders = {
    "Digitraffic-User" : "AWS Canary",
    "Accept-Encoding" : "gzip",
    "Accept": [MediaType.TEXT_HTML, MediaType.APPLICATION_JSON].join(',')
} as any;

const API_KEY_HEADER = "x-api-key";

const OK_RESOLUTION = "OK";

export class UrlChecker {
    readonly requestOptions: any;

    constructor(hostname: string, apiKey?: string) {
        const headers = {...baseHeaders};

        if(apiKey) {
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

    async expect200(url: string, callback?: any): Promise<any> {
        const requestOptions = {...this.requestOptions, ...{
            path: url
        }};

        await synthetics.executeHttpStep("Verify " + url, requestOptions, callback);
    }

    async expect403WithoutApiKey(url: string): Promise<any> {
        const requestOptions = {...this.requestOptions, ...{
            path: url,
            headers: baseHeaders
        }};

        await synthetics.executeHttpStep("Verify " + url, requestOptions, validateStatusCodeFunction(403));
    }

    async done(): Promise<string> {
        return "Canary succesfull";
   }
}

export function responseChecker(fn: any): any {
    return async (res: any) => {
        console.info("response headers " + JSON.stringify(res.headers, null, 2));

        if (res.statusCode < 200 || res.statusCode > 299) {
            throw res.statusCode + ' ' + res.statusMessage;
        }

        const body = await getResponseBody(res);

        fn(body);
    };
}

async function getResponseBody(response: any): Promise<string> {
    const body: Buffer = await new Promise(async (resolve: any) => {
        let buffers: Buffer[] = [];

        response.on('data', (data: any) => {
            buffers.push(data);
        });

        response.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
    });

    if(response.headers["content-encoding"] === 'gzip') {
        try {
            return zlib.gunzipSync(body).toString();
        } catch(e) {
            console.info("error " + JSON.stringify(e));
        }
    }

    return body.toString();
}

export function mustContain(body: string, text: string) {
    console.info("checking " + body);

    if(!body.includes(text)) {
        console.info("Did not contain " + text);
        throw "Did not contain " + text;
    }
}

// Validate status code
function validateStatusCodeFunction(statusCode: number) {
    return async (res: any) => {
        return new Promise(resolve => {
            if (res.statusCode !== statusCode) {
                throw `${res.statusCode} ${res.statusMessage}`;
            }

            resolve(OK_RESOLUTION);
        });
    };
}
