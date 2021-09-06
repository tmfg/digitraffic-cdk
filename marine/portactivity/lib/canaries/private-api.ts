import {UrlTestCode} from "digitraffic-common/canaries/url-test-code";

const hostname = process.env.hostname as string;
const apikey = process.env.apikey as string;

export const handler = async () => {
    const suite = new UrlTestCode(hostname, apikey as string);

    await suite.expect200("/api/v1/timestamps?locode=FIHKO");
    await suite.expect403WithoutApiKey("/api/v1/timestamps?locode=FIHKO");

    return suite.resolve();
}
