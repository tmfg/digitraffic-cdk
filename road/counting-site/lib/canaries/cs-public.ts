import {
    ContentChecker,
    ContentTypeChecker,
    GeoJsonChecker,
    HeaderChecker,
    UrlChecker
} from "@digitraffic/common/dist/aws/infra/canaries/url-checker";
import { DbData } from "../model/data";
import { Asserter } from "@digitraffic/common/dist/test/asserter";
import { constants } from "http2";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { ResultDomain } from "../model/domain";
import { ResultUserTypes } from "../model/usertype";

const BASE_URL = "/prod/api/counting-site/v1/";
const USERTYPES_URL = BASE_URL + "user-types";
const DOMAINS_URL = BASE_URL + "domains";
const DIRECTIONS_URL = BASE_URL + "directions";

const VALUES_URL = BASE_URL + "values";
const COUNTERS_URL = BASE_URL + "counters";
const CSV_URL = BASE_URL + "values.csv";

export const handler = async (): Promise<string> => {
    const checker = await UrlChecker.createV2();

    // check user types
    await checker.expect403WithoutApiKey(USERTYPES_URL);
    await checker.expect200(
        USERTYPES_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((userTypes: ResultUserTypes) => {
            Asserter.assertLengthGreaterThan(Object.keys(userTypes), 1);
        })
    );

    // check domains
    await checker.expect403WithoutApiKey(DOMAINS_URL);
    await checker.expect200(
        DOMAINS_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((domains: ResultDomain[]) => {
            Asserter.assertLengthGreaterThan(domains, 1);
        })
    );

    // check directions
    await checker.expect403WithoutApiKey(DIRECTIONS_URL);
    await checker.expect200(
        DIRECTIONS_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((directions: Record<number, string>) => {
            Asserter.assertLength(Object.keys(directions), 3);
        })
    );

    // json values
    await checker.expect403WithoutApiKey(VALUES_URL + "?counter_id=4");
    await checker.expect200(
        VALUES_URL + "?counter_id=9999999",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((json: DbData[]) => {
            Asserter.assertLength(json, 0);
        })
    );
    await checker.expect200(
        VALUES_URL + "?counter_id=4",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        HeaderChecker.checkHeaderMissing(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        ContentChecker.checkJson((json: DbData[]) => {
            Asserter.assertLengthGreaterThan(json, 10);
        })
    );
    await checker.expect400(VALUES_URL + "?counter_id=4&year=2300&month=5");
    await checker.expect400(VALUES_URL + "?counter_id=4&year=bad_input&month=5");

    // counters
    await checker.expect403WithoutApiKey(COUNTERS_URL + "?domain_name=Oulu");
    await checker.expect200(
        COUNTERS_URL + "?domain_name=Moscow",
        GeoJsonChecker.validFeatureCollection((fc) => {
            Asserter.assertLength(fc.features, 0);
        })
    );
    await checker.expect200(
        COUNTERS_URL + "?domain_name=Oulu",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        GeoJsonChecker.validFeatureCollection((fc) => {
            Asserter.assertLengthGreaterThan(fc.features, 1);
        })
    );
    await checker.expect200(
        COUNTERS_URL,
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        GeoJsonChecker.validFeatureCollection((fc) => {
            Asserter.assertLengthGreaterThan(fc.features, 1);
        })
    );

    // counter
    await checker.expect403WithoutApiKey(COUNTERS_URL + "/13");
    await checker.expect200(COUNTERS_URL + "/13", GeoJsonChecker.validFeatureCollection());
    await checker.expect404(COUNTERS_URL + "/013");
    await checker.expect404(COUNTERS_URL + "/999999");
    await checker.expect404(COUNTERS_URL + "/bad_input");
    await checker.expect404(COUNTERS_URL + "/.9");

    // csv values
    await checker.expect403WithoutApiKey(CSV_URL + "?year=2022&month=01&counter_id=15");
    await checker.expect200(
        CSV_URL + "?year=2022&month=01&counter_id=15",
        ContentTypeChecker.checkContentType(MediaType.TEXT_CSV),
        HeaderChecker.checkHeaderExists(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        ContentChecker.checkResponse((body) => {
            Asserter.assertLengthGreaterThan(body.split("\n"), 10);
        })
    );
    await checker.expect200(
        CSV_URL + "?year=2022&month=01&counter_id=-21",
        ContentChecker.checkResponse((body) => {
            Asserter.assertLength(body.split("\n"), 2); // just header
        })
    );
    await checker.expect400(CSV_URL + "?year=2021");
    await checker.expect400(CSV_URL + "?year=2021&month=34&counter_id=15");
    await checker.expect400(CSV_URL + "?year=bad_input&month=3&counter_id=15");

    return checker.done();
};
