import {UrlChecker} from "@digitraffic/common/aws/infra/canaries/url-checker";
import {getSecret} from "@digitraffic/common/aws/runtime/secrets/secret";
import {ShiplistSecret} from "../lambda/get-shiplist-public/get-shiplist-public";
import {ENV_HOSTNAME, ENV_SECRET} from "@digitraffic/common/aws/infra/canaries/url-canary";
import {envValue} from "@digitraffic/common/aws/runtime/environment";

const hostname = envValue(ENV_HOSTNAME);
const secretId = envValue(ENV_SECRET);

export const handler = async (): Promise<string> => {
    const secret = await getSecret<ShiplistSecret>(secretId, 'shiplist');
    const checker = new UrlChecker(hostname);

    await checker.expect200("/prod/shiplist?locode=FIHKO&auth=" + secret.auth);
    await checker.expect200("/prod/shiplist?locode=FIHEL&auth=" + secret.auth);
    await checker.expect200("/prod/api/v1/metadata");

    return checker.done();
};
