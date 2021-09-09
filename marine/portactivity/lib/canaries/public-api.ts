import {UrlChecker} from "digitraffic-common/canaries/url-checker";

const hostname = process.env.hostname as string;

export const handler = async () => {
    const checker = new UrlChecker(hostname);

    await checker.expect200("/shiplist?locode=FIHKO");
    await checker.expect200("/shiplist?locode=FIHEL");
    await checker.expect200("/api/v1/metadata");

    return checker.done();
}
