import {jsonChecker, UrlChecker} from "digitraffic-common/canaries/url-checker";
import assert from "assert";

const hostname = process.env.hostname as string;
const apiKeyId = process.env.apiKeyId as string;

export const handler = async () => {
    const checker = new UrlChecker(hostname); // api key disabled atm

    await checker.expect200("/prod/api/counting-sites/beta/metadata", jsonChecker((json: any) => {
        assert.ok(json.domains.length === 1);
        assert.ok(json.domains[0].counters.length > 10);
    }));

    await checker.expect200("/prod/api/counting-sites/beta/values/4", jsonChecker((json: any) => {
        assert.ok(json.length > 10);
    }));

    await checker.expect200("/prod/api/counting-sites/beta/values/3", jsonChecker((json: any) => {
        assert.ok(json.length === 0);
    }));

    return checker.done();
}
