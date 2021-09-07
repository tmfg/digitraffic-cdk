import {UrlChecker} from "digitraffic-common/canaries/url-checker";
import {getApiKeyFromAPIGateway} from "digitraffic-common/api/apikey";

export const API_KEY_HEADER = "x-api-key";

const hostname = process.env.hostname as string;
const apiKeyId = process.env.apiKeyId as string;

export const handler = async () => {
    const apiKey = await getApiKeyFromAPIGateway(apiKeyId);
    const checker = new UrlChecker(hostname, apiKey.value);

    await checker.expect200("/api/v1/timestamps?locode=FIHKO");
    await checker.expect403WithoutApiKey("/api/v1/timestamps?locode=FIHKO");

    return checker.done();
}
