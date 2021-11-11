import {UrlChecker} from "digitraffic-common/canaries/url-checker";
import {MediaType} from "digitraffic-common/api/mediatypes";

const hostname = process.env.hostname as string;
const apiKeyId = process.env.apiKeyId as string;

export const handler = async () => {
    const checker = await UrlChecker.create(hostname, apiKeyId);

    await checker.expect200("/prod/api/v1/timestamps?locode=FIHKO");
    await checker.expect403WithoutApiKey("/prod/api/v1/timestamps?locode=FIHKO", MediaType.APPLICATION_JSON);

    return checker.done();
}
