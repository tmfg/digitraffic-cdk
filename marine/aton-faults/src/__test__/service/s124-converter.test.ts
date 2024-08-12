import { TEST_ACTIVE_WARNINGS_VALID } from "../db-testutil.js";
import { convertWarning } from "../../service/s124-converter.js";
import * as xsdValidator from "xsd-schema-validator";
import { Builder } from "xml2js";
import type { Feature } from "geojson";

describe("converter-service", () => {
    test("convert - warnings warning", async () => {
        expect(TEST_ACTIVE_WARNINGS_VALID.features).toHaveLength(7);
        const converted = convertWarning(TEST_ACTIVE_WARNINGS_VALID.features[0] as Feature);
        const xml = new Builder().buildObject(converted);

        const result = await xsdValidator.validateXML(xml, "src/__test__/service/S124.xsd");
        expect(result.valid).toBe(true);

        //console.info(xml);
    });
});
