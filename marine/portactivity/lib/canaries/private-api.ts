import { UrlChecker } from "@digitraffic/common/dist/aws/infra/canaries/url-checker";
import {
    ENV_API_KEY,
    ENV_HOSTNAME,
} from "@digitraffic/common/dist/aws/infra/canaries/canary-keys";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";

const hostname = envValue(ENV_HOSTNAME);
const apiKeyId = envValue(ENV_API_KEY);

export const handler = async (): Promise<string> => {
    const checker = await UrlChecker.create(hostname, apiKeyId);

    await checker.expect200("/prod/api/v1/timestamps?locode=FIHKO");
    await checker.expect403WithoutApiKey(
        "/prod/api/v1/timestamps?locode=FIHKO"
    );
    await checker.expect200("/prod/api/v1/metadata/locodes");
    await checker.expect403WithoutApiKey(
        "/prod/api/v1/metadata/locodes"
    );

    return checker.done();
};
