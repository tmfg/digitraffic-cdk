import {
    ContentChecker,
    ContentTypeChecker,
    GeoJsonChecker,
    HeaderChecker,
    UrlChecker,
} from "digitraffic-common/aws/infra/canaries/url-checker";
import {DbData} from "../model/data";
import {Asserter} from "digitraffic-common/test/asserter";
import {constants} from "http2";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {ResultDomain} from "../model/domain";
import {ResultUserTypes} from "../model/usertype";

const BASE_URL = "/prod/api/counters/beta/";
const USERTYPES_URL = BASE_URL + "user-types";
const DOMAINS_URL = BASE_URL + "domains";
const DIRECTIONS_URL = BASE_URL + "directions";

const VALUES_URL = BASE_URL + "values";
const COUNTERS_URL = BASE_URL + "counters";
const CSV_URL = BASE_URL + "csv-values";

export const handler = async () => {
    const checker = await UrlChecker.createV2();

    // check user types
    await checker.expect403WithoutApiKey(USERTYPES_URL);
    await checker.expect200(USERTYPES_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((userTypes: ResultUserTypes) => {
            Asserter.assertLengthGreaterThan(Object.keys(userTypes), 1);
        }));

    // check domains
    await checker.expect403WithoutApiKey(DOMAINS_URL);
    await checker.expect200(DOMAINS_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((domains: ResultDomain[]) => {
            Asserter.assertLengthGreaterThan(domains, 1);
        }));

    // check directions
    await checker.expect403WithoutApiKey(DIRECTIONS_URL);
    await checker.expect200(DIRECTIONS_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((directions: Record<number, string>) => {
            Asserter.assertLength(Object.keys(directions), 3);
        }));

    // json values
    await checker.expect403WithoutApiKey(VALUES_URL + "/4");
    await checker.expect404(VALUES_URL + "/9999999");
    await checker.expect200(VALUES_URL + "/4",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        HeaderChecker.checkHeaderMissing(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        ContentChecker.checkJson((json: DbData[]) => {
            Asserter.assertLengthGreaterThan(json, 10);
        }));

    // counters
    await checker.expect403WithoutApiKey(COUNTERS_URL + "/Oulu");
    await checker.expect404(COUNTERS_URL + "/Moscow");
    await checker.expect200(COUNTERS_URL + "/Oulu",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        GeoJsonChecker.validFeatureCollection());

    // csv values
    await checker.expect403WithoutApiKey(CSV_URL + "/2022/01?counterId=15");
    await checker.expect200(CSV_URL + "/2022/01?counterId=15",
        ContentTypeChecker.checkContentType(MediaType.TEXT_CSV),
        HeaderChecker.checkHeaderExists(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        ContentChecker.checkResponse(body => {
            Asserter.assertLengthGreaterThan(body.split('\n'), 10);
        }));

    await checker.expect200(CSV_URL + "/2022/01?counterId=-21", ContentChecker.checkResponse(body => {
        Asserter.assertLength(body.split('\n'), 0); // just header
    }));

    return checker.done();
};