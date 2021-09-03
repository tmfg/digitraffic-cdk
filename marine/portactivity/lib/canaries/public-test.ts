import {UrlTestCode} from "digitraffic-common/canaries/url-test-code";

const hostname = process.env.hostname as string;

export const handler = async () => {
    const suite = new UrlTestCode(hostname);

    await suite.expect200("/shiplist?locode=FIHKO");
    await suite.expect200("/shiplist?locode=FIHEL");
    await suite.expect200("/api/v1/metadata");

    return suite.resolve();
}
