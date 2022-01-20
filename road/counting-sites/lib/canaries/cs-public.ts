import {
    ContentChecker,
    ContentTypeChecker,
    GeoJsonChecker,
    HeaderChecker,
    ResponseChecker,
    UrlChecker,
} from "digitraffic-common/aws/infra/canaries/url-checker";
import {MetadataResponse} from "../model/metadata";
import {DbData} from "../model/data";
import * as Assert from "digitraffic-common/test/asserter";
import {constants} from "http2";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";

const BASE_URL = "/prod/api/counters/beta/";
const METADATA_URL = BASE_URL + "metadata";
const DATA_URL = BASE_URL + "values";
const COUNTERS_URL = BASE_URL + "counters";
const CSV_URL = BASE_URL + "csv-values";

export const handler = async () => {
    const checker = await UrlChecker.createV2();

    await checker.expect403WithoutApiKey(METADATA_URL);
    await checker.expect200(METADATA_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((json: MetadataResponse) => {
            Assert.assertLength(json.domains, 1);
        }));

    await checker.expect403WithoutApiKey(DATA_URL + "/4");
    await checker.expect404(DATA_URL + "/9999999");
    await checker.expect200(DATA_URL + "/4",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        HeaderChecker.checkHeaderMissing(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        ContentChecker.checkJson((json: DbData[]) => {
            Assert.assertLengthGreaterThan(json, 10);
        }));

    await checker.expect403WithoutApiKey(COUNTERS_URL + "/Oulu");
    await checker.expect404(COUNTERS_URL + "/Moscow");
    await checker.expect200(COUNTERS_URL + "/Oulu",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        GeoJsonChecker.validFeatureCollection());

    await checker.expect403WithoutApiKey(CSV_URL + "/2022/01?counterId=15");
    await checker.expect200(CSV_URL + "/2022/01?counterId=15",
        ContentTypeChecker.checkContentType(MediaType.TEXT_CSV),
        HeaderChecker.checkHeaderExists(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        ContentChecker.checkResponse(body => {
            Assert.assertLengthGreaterThan(body.split('\n'), 10);
        }));

    await checker.expect200(CSV_URL + "/2022/01?counterId=-21", ContentChecker.checkResponse(body => {
        Assert.assertLength(body.split('\n'), 0); // just header
    }));

    return checker.done();
};