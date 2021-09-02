import {UrlTestCode} from "digitraffic-common/canaries/url-test-code";

const hostname = process.env.hostname as string;

export const handler = async () => {
    const test = new UrlTestCode(hostname);

    test.test("/shiplist?locode=FIHKO");
    test.test("/shiplist?locode=FIHEL");

    return "Canary succesfull";
};