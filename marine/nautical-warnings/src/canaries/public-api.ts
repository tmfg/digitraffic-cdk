import {
    ContentTypeChecker,
    GeoJsonChecker,
    UrlChecker
} from "@digitraffic/common/dist/aws/infra/canaries/url-checker";
import type { FeatureCollection } from "geojson";
import { Asserter } from "@digitraffic/common/dist/test/asserter";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";

export const handler: () => Promise<string> = async () => {
    const checker = await UrlChecker.createV2();

    await checker.expect200(
        "/prod/api/nautical-warning/v1/warnings/active",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        GeoJsonChecker.validFeatureCollection((json: FeatureCollection) => {
            Asserter.assertLengthGreaterThan(json.features, 1);
            Asserter.assertGreaterThan(json.features[0]?.properties?.["id"] as number, 0);
        })
    );

    await checker.expect200(
        "/prod/api/nautical-warning/v1/warnings/archived",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        GeoJsonChecker.validFeatureCollection()
    );

    return checker.done();
};
