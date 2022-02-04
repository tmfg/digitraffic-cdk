import {ContentTypeChecker, GeoJsonChecker, UrlChecker} from "digitraffic-common/aws/infra/canaries/url-checker";
import {FeatureCollection} from "geojson";
import {Asserter} from "digitraffic-common/test/asserter";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";

export const handler = async () => {
    const checker = await UrlChecker.createV2();

    await checker.expect200("/prod/api/nautical-warnings/beta/active",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        GeoJsonChecker.validFeatureCollection((json: FeatureCollection) => {
            Asserter.assertLengthGreaterThan(json.features, 1);
            Asserter.assertGreaterThan(json.features[0]?.properties?.id, 0);
        }));

    await checker.expect200("/prod/api/nautical-warnings/beta/archived",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        GeoJsonChecker.validFeatureCollection());

    return checker.done();
};
