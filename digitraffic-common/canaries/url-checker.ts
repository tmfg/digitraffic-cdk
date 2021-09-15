import {MediaType} from "../api/mediatypes";

const synthetics = require('Synthetics');

const baseHeaders = {
    "Digitraffic-User" : "AWS Canary",
    "Accept-Encoding" : "gzip",
    "Accept": [MediaType.TEXT_HTML, MediaType.APPLICATION_JSON].join(',')
} as any;

const API_KEY_HEADER = "x-api-key";

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

    async expect200(url: string): Promise<string> {
        console.info("canary checking url " + url);

        const requestOptions = {...this.requestOptions, ...{
            path: url
        }};

        return synthetics.executeHttpStep("Verify " + url, requestOptions);
    }

    async expect403WithoutApiKey(url: string): Promise<string> {
        console.info("canary checking url " + url);

        const requestOptions = {...this.requestOptions, ...{
            path: url,
            headers: baseHeaders
        }};

        return synthetics.executeHttpStep("Verify " + url, requestOptions, validateStatusCodeFunction(403));
    }

    async done(): Promise<string> {
        return "Canary succesfull";
   }
}

// Validate status code
function validateStatusCodeFunction(statusCode: number) {
    return async (res: any) => {
        return new Promise(resolve => {
            if (res.statusCode !== statusCode) {
                throw new Error(`${res.statusCode} ${res.statusMessage}`);
            }

            resolve("OK");
        });
    };
}