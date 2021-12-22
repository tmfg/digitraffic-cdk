import assert from "assert";
import {FeatureCollection} from "geojson";
import {ResponseChecker, UrlChecker} from "digitraffic-common/canaries/url-checker";
import {MetadataResponse} from "../model/metadata";
import {DbData} from "../model/data";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const GeoJsonValidator = require('geojson-validation');

const METADATA_URL = "/prod/api/counters/beta/metadata";
const DATA_URL = "/prod/api/counters/beta/values";
const COUNTERS_URL = "/prod/api/counters/beta/counters";

export const handler = async () => {
    const checker = await UrlChecker.createV2();
    const rc = ResponseChecker.forJson();

    await checker.expect403WithoutApiKey(METADATA_URL);
    await checker.expect200(METADATA_URL, rc.checkJson((json: MetadataResponse) => {
        assert.ok(json.domains.length === 1);
    }));

    await checker.expect403WithoutApiKey(DATA_URL + "/4");
    await checker.expect404(DATA_URL + "/9999999");
    await checker.expect200(DATA_URL + "/4", rc.checkJson((json: DbData[]) => {
        assert.ok(json.length > 10);
    }));

    await checker.expect403WithoutApiKey(COUNTERS_URL + "/Oulu");
    await checker.expect404(COUNTERS_URL + "/Moscow");
    await checker.expect200(COUNTERS_URL + "/Oulu", ResponseChecker.forGeojson().checkJson((json: FeatureCollection) => {
        assert.ok(json.type === 'FeatureCollection');
        assert.ok(GeoJsonValidator.valid(json));
    }));

    return checker.done();
};