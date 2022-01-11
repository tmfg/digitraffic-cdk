import {jsonChecker, UrlChecker} from "digitraffic-common/aws/canaries/url-checker";
import assert from "assert";
import {FeatureCollection} from "geojson";

const hostname = process.env.hostname as string;
const apiKeyId = process.env.apiKeyId as string;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const gjv = require("geojson-validation");

export const handler = async () => {
    const checker = await UrlChecker.create(hostname, apiKeyId);

    await checker.expect200("/prod/api/nautical-warnings/beta/active", jsonChecker((json: FeatureCollection) => {
        assert.ok(gjv.isFeatureCollection(json));
        assert.ok(json.features.length > 1);
        assert.ok(json.features[0]?.properties?.id > 0);
    }));

    await checker.expect200("/prod/api/nautical-warnings/beta/archived", jsonChecker((json: FeatureCollection) => {
        assert.ok(gjv.isFeatureCollection(json));
    }));

    return checker.done();
};
