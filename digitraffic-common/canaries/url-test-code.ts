import {MediaType} from "../api/mediatypes";

const synthetics = require('Synthetics');

export class UrlTestCode {
    readonly requestOptions: any;

    constructor(hostname: string) {
        this.requestOptions = {
            hostname,
            method: 'GET',
            protocol: 'https:',
            headers: {
                "Digitraffic-User" : "AWS Canary",
                "Accept-Encoding" : "gzip",
                "Accept": [MediaType.TEXT_HTML, MediaType.APPLICATION_JSON].join(',')
            }
        } as any;

        synthetics.getConfiguration()
            .withIncludeRequestBody(true)
            .withIncludeRequestHeaders(true)
            .withIncludeResponseBody(true)
            .withIncludeResponseHeaders(true);
    }

    async test(url: string): Promise<string> {
        console.info("canary checking url " + url);

        this.requestOptions.path = url;

        return await synthetics.executeHttpStep("Verify " + url, this.requestOptions);
    }

    async resolve(): Promise<string> {
        return "Canary succesfull";
   }
}
