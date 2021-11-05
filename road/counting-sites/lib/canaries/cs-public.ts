import {ResponseChecker, UrlChecker} from "digitraffic-common/canaries/url-checker";
import assert from "assert";

const GeoJsonValidator = require('geojson-validation');

const hostname = process.env.hostname as string;
const apiKeyId = process.env.apiKeyId as string;

export const handler = async () => {
    const checker = new UrlChecker(hostname); // api key disabled atm
    const rc = ResponseChecker.forJson();

    await checker.expect200("/prod/api/counters/beta/metadata", rc.checkJson((json: any) => {
        assert.ok(json.domains.length === 1);
    }));

    await checker.expect200("/prod/api/counters/beta/values/4", rc.checkJson((json: any) => {
        assert.ok(json.length > 10);
    }));

    await checker.expect404("/prod/api/counters/beta/values/3");

    await checker.expect200("/prod/api/counters/beta/counters/Oulu", ResponseChecker.forGeojson().checkJson((json: any) => {
        assert.ok(json.type === 'FeatureCollection');
        assert.ok(GeoJsonValidator.valid(json));
    }));

    await checker.expect404("/prod/api/counters/beta/counters/Moscow");

    return checker.done();
}
