import {
    GeoJsonChecker,
    HeaderChecker,
    ResponseChecker,
    UrlChecker,
} from "digitraffic-common/aws/infra/canaries/url-checker";
import {MetadataResponse} from "../model/metadata";
import {DbData} from "../model/data";
import * as Assert from "digitraffic-common/test/asserter";
import {constants} from "http2";

const BASE_URL = "/prod/api/counters/beta/";
const METADATA_URL = BASE_URL + "metadata";
const DATA_URL = BASE_URL + "values";
const COUNTERS_URL = BASE_URL + "counters";
const CSV_URL = BASE_URL + "csv-values";

export const handler = async () => {
    const checker = await UrlChecker.createV2();
    const rc = ResponseChecker.forJson();

    await checker.expect403WithoutApiKey(METADATA_URL);
    await checker.expect200(METADATA_URL, rc.checkJson((json: MetadataResponse) => {
        Assert.assertLength(json.domains, 1);
    }));

    await checker.expect403WithoutApiKey(DATA_URL + "/4");
    await checker.expect404(DATA_URL + "/9999999");
    await checker.expect200(DATA_URL + "/4",
        HeaderChecker.checkHeaderMissing(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        rc.checkJson((json: DbData[]) => {
            Assert.assertLengthGreaterThan(json, 10);
        }));

    await checker.expect403WithoutApiKey(COUNTERS_URL + "/Oulu");
    await checker.expect404(COUNTERS_URL + "/Moscow");
    await checker.expect200(COUNTERS_URL + "/Oulu",
        GeoJsonChecker.validFeatureCollection());

    await checker.expect403WithoutApiKey(CSV_URL + "/2022/01?counterId=15");
    await checker.expect200(CSV_URL + "/2022/01?counterId=15",
        HeaderChecker.checkHeaderExists(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        ResponseChecker.forCSV().responseChecker(body => {
            Assert.assertLengthGreaterThan(body.split('\n'), 10);
        }));

    await checker.expect200(CSV_URL + "/2022/01?counterId=-21", ResponseChecker.forCSV().responseChecker(body => {
        Assert.assertLength(body.split('\n'), 0); // just header
    }));

    return checker.done();
};