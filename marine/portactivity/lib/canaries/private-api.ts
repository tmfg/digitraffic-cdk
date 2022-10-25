import {UrlChecker} from "@digitraffic/common/aws/infra/canaries/url-checker";
import {getEnv} from "aws-cdk-lib/custom-resources/lib/provider-framework/runtime/util";
import {ENV_API_KEY, ENV_HOSTNAME} from "@digitraffic/common/aws/infra/canaries/url-canary";

const hostname = getEnv(ENV_HOSTNAME);
const apiKeyId = getEnv(ENV_API_KEY);

export const handler = async (): Promise<string> => {
    const checker = await UrlChecker.create(hostname, apiKeyId);

    await checker.expect200("/prod/api/v1/timestamps?locode=FIHKO");
    await checker.expect403WithoutApiKey("/prod/api/v1/timestamps?locode=FIHKO");

    return checker.done();
};
