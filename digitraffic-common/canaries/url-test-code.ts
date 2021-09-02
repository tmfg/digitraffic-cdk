const synthetics = require('Synthetics');

const checker = async (res: any) => {

};

const checkOptions = {

};

export class UrlTestCode {
    readonly requestOptions: any;

    constructor(hostname: string) {
        this.requestOptions = {
            hostname,
            method: 'GET',
            protocol: 'https:',
            headers: {
                "Digitraffic-User" : "AWS Canary"
            }
        } as any;
    }

    async test(url: string): Promise<string> {
        console.info("canary checking url " + url);

        this.requestOptions.path = url;

        return await synthetics.executeHttpStep("Verify " + url, this.requestOptions);
    }
}
