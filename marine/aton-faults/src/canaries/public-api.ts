import { ResponseChecker, UrlChecker } from "@digitraffic/common/dist/aws/infra/canaries/url-checker";
import assert from "assert";
import type { WarningFeature, WarningFeatureCollection } from "../model/warnings.js";

const API_PATH = "/prod/api/aton/v1/faults";

export const handler = async (): Promise<string> => {
    const checker = await UrlChecker.createV2();
    const rs = ResponseChecker.forGeojson();

    await checker.expect200(
        API_PATH + "?language=fi",
        rs.checkJson((json: WarningFeatureCollection) => {
            assert.ok(json.features.length > 10);
            assert.ok(json.features.some((f: WarningFeature) => f.properties.state === "Kirjattu"));
        })
    );

    await checker.expect200(
        API_PATH + "?language=sv",
        rs.checkJson((json: WarningFeatureCollection) => {
            assert.ok(json.features.length > 10);
            assert.ok(json.features.some((f: WarningFeature) => f.properties.state === "Registrerad"));
        })
    );

    // unknown locale ge -> english is used
    await checker.expect200(
        API_PATH + "?language=ge",
        rs.checkJson((json: WarningFeatureCollection) => {
            assert.ok(json.features.length > 10);
            assert.ok(json.features.some((f: WarningFeature) => f.properties.state === "Registered"));
        })
    );

    await checker.expect403WithoutApiKey(API_PATH + "?language=fi");
    await checker.expect400(API_PATH + "?fixed_in_hours=-2");
    await checker.expect400(API_PATH + "?fixed_in_hours=12345567");

    return checker.done();
};
