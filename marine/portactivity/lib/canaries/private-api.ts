import {UrlChecker} from "@digitraffic/common/aws/infra/canaries/url-checker";
import {ENV_API_KEY, ENV_HOSTNAME} from "@digitraffic/common/aws/infra/canaries/url-canary";
import {envValue} from "@digitraffic/common/aws/runtime/environment";

const hostname = envValue(ENV_HOSTNAME);
const apiKeyId = envValue(ENV_API_KEY);

export const handler = async (): Promise<string> => {
    const checker = await UrlChecker.create(hostname, apiKeyId);

    await checker.expect200("/prod/api/v1/timestamps?locode=FIHKO");
    await checker.expect403WithoutApiKey("/prod/api/v1/timestamps?locode=FIHKO");

    return checker.done();
};
