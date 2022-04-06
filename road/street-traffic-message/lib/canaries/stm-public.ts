import {ContentChecker, ContentTypeChecker, UrlChecker} from "digitraffic-common/aws/infra/canaries/url-checker";
import {Asserter} from "digitraffic-common/test/asserter";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {FeatureCollection} from "geojson";

const BASE_URL = "/prod/api/street-traffic-message/beta/";

const PERMITS_GEOJSON_URL = BASE_URL + "messages";
const PERMITS_D2LIGHT_URL = BASE_URL + "messages.d2light";

type D2LightMessage = {
    situationPublicationLight: {
        situationRecord: {
            id: number,
        }[],
    }
}

export const handler = async () => {
    const checker = await UrlChecker.createV2();

    // geojson
    await checker.expect403WithoutApiKey(PERMITS_GEOJSON_URL);
    await checker.expect200(PERMITS_GEOJSON_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        ContentChecker.checkJson((json: FeatureCollection) => {
            Asserter.assertLengthGreaterThan(json.features, 0);
        }));

    // d2light
    await checker.expect403WithoutApiKey(PERMITS_D2LIGHT_URL);
    await checker.expect200(PERMITS_D2LIGHT_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((json: D2LightMessage) => {
            Asserter.assertLengthGreaterThan(json.situationPublicationLight.situationRecord, 0);
        }));

    return checker.done();
};