import {UrlChecker} from "digitraffic-common/aws/canaries/url-checker";

const hostname = process.env.hostname as string;
const apiKeyId = process.env.apiKeyId as string;

export const handler = async (): Promise<string> => {
    const checker = await UrlChecker.create(hostname, apiKeyId);

    await checker.expect200("/prod/api/v1/timestamps?locode=FIHKO");
    await checker.expect403WithoutApiKey("/prod/api/v1/timestamps?locode=FIHKO");

    return checker.done();
};
