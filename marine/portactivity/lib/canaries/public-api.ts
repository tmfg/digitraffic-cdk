import {UrlChecker} from "digitraffic-common/canaries/url-checker";

const hostname = process.env.hostname as string;

export const handler = async (): Promise<string> => {
    const checker = new UrlChecker(hostname);

    await checker.expect200("/prod/shiplist?locode=FIHKO");
    await checker.expect200("/prod/shiplist?locode=FIHEL");
    await checker.expect200("/prod/api/v1/metadata");

    return checker.done();
}
