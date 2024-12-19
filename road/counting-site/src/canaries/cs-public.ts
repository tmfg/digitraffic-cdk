import {
    ContentChecker,
    ContentTypeChecker,
    GeoJsonChecker,
    HeaderChecker,
    UrlChecker
} from "@digitraffic/common/dist/aws/infra/canaries/url-checker";
import { Asserter } from "@digitraffic/common/dist/test/asserter";
import { constants } from "http2";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { ResponseValue } from "../model/v2/response-model.js";

const BASE_URL = "/prod/api/counting-site/v2/";
const DIRECTIONS_URL = BASE_URL + "directions";
const TRAVEL_MODES_URL = BASE_URL + "travel-modes";
const VALUES_URL = BASE_URL + "values";
const SITES_URL = BASE_URL + "sites";
const CSV_URL = BASE_URL + "values.csv";

export const handler = async (): Promise<string> => {
    const checker = await UrlChecker.createV2();

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
    await checker.expect403WithoutApiKey(VALUES_URL + "?siteId=1&date=2024-10-01");
    await checker.expect200(
        VALUES_URL + "?siteId=1&date=2024-10-01",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((json: ResponseValue[]) => {
            Asserter.assertLength(json, 0);
        })
    );
    await checker.expect200(
        VALUES_URL + "?siteId=300035277&date=2024-10-01",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        HeaderChecker.checkHeaderMissing(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        ContentChecker.checkJson((json: ResponseValue[]) => {
            Asserter.assertLengthGreaterThan(json, 10);
        })
    );
    await checker.expect400(VALUES_URL + "?date=bad_input");

    // sites
    await checker.expect403WithoutApiKey(SITES_URL);
    await checker.expect200(SITES_URL + "/300035277", 
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_GEOJSON),
        GeoJsonChecker.validFeatureCollection((fc) => {
            Asserter.assertLengthGreaterThan(fc.features, 1);
        })
    );

    // travel-modes
    await checker.expect403WithoutApiKey(TRAVEL_MODES_URL);
    await checker.expect200(TRAVEL_MODES_URL);
    
    
    // csv values
    await checker.expect403WithoutApiKey(CSV_URL + "?year=2024&month=10&siteId=300035277");
    await checker.expect200(
        CSV_URL + "?year=2024&month=10&siteId=300035277",
        ContentTypeChecker.checkContentType(MediaType.TEXT_CSV),
        HeaderChecker.checkHeaderExists(constants.HTTP2_HEADER_CONTENT_DISPOSITION),
        ContentChecker.checkResponse((body) => {
            Asserter.assertLengthGreaterThan(body.split("\n"), 10);
        })
    );
    await checker.expect200(
        CSV_URL + "?year=2022&month=10&siteId=300035277",
        ContentChecker.checkResponse((body) => {
            Asserter.assertLength(body.split("\n"), 2); // just header
        })
    );
    
    await checker.expect400(CSV_URL + "?date=bad_input");

    return checker.done();
};
