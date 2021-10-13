import {jsonChecker, UrlChecker} from "digitraffic-common/canaries/url-checker";
import assert from "assert";

const hostname = process.env.hostname as string;

export const handler = async () => {
    const checker = new UrlChecker(hostname);

    await checker.expect200("/api/nautical-warnings/beta/active", jsonChecker((json: any) => {
        assert.strictEqual('FeatureCollection', json.type);
        assert.ok(json.features.length > 1);
        assert.ok(json.features[0].properties.ID > 0);
    }));

    await checker.expect200("/api/nautical-warnings/beta/archived", jsonChecker((json: any) => {
        assert.strictEqual('FeatureCollection', json.type);
    }));

    return checker.done();
}
