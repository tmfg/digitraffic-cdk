import {ResponseChecker, UrlChecker} from "digitraffic-common/canaries/url-checker";
import assert from "assert";
import {Feature, FeatureCollection} from "geojson";

const API_PATH = "/prod/api/aton/v1/faults";

export const handler = async () => {
    const checker = await UrlChecker.createV2();
    const rs = ResponseChecker.forGeojson();

    await checker.expect200(API_PATH + "?language=fi", rs.checkJson((json: FeatureCollection) => {
        assert.ok(json.features.length > 10);
        assert.ok(json.features.some((f: Feature) => f.properties?.state === 'Kirjattu'));
    }));

    await checker.expect200(API_PATH + "?language=sv", rs.checkJson((json: FeatureCollection) => {
        assert.ok(json.features.length > 10);
        assert.ok(json.features.some((f: Feature) => f.properties?.state === 'Registrerad'));
    }));

    // unknown locale ge -> english is used
    await checker.expect200(API_PATH + "?language=ge", rs.checkJson((json: FeatureCollection) => {
        assert.ok(json.features.length > 10);
        assert.ok(json.features.some((f: Feature) => f.properties?.state === 'Registered'));
    }));

    await checker.expect403WithoutApiKey(API_PATH + "?language=fi");

    return checker.done();
};
