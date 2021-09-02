import {UrlTestCode} from "digitraffic-common/canaries/url-test-code";

const hostname = process.env.hostname as string;

export const handler = async () => {
    const suite = new UrlTestCode(hostname);

    await suite.test("/shiplist?locode=FIHKO");
    await suite.test("/shiplist?locode=FIHEL");
    await suite.test("/api/v1/metadata");

    return suite.resolve();
};