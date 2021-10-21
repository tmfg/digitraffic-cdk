import {dbTestBase, TEST_ACTIVE_WARNINGS_VALID} from "../db-testutil";
import {IDatabase} from "pg-promise";
import {convertWarnings} from "../../lib/service/s124-converter";
import * as xsdValidator from "xsd-schema-validator";
import {Builder} from "xml2js";

describe('converter-service', dbTestBase((db: IDatabase<any, any>) => {

    test('convert - warnings warning', async () => {
        expect(TEST_ACTIVE_WARNINGS_VALID.features).toHaveLength(7);
        const converted = await convertWarnings(TEST_ACTIVE_WARNINGS_VALID.features);
        const xml = new Builder().buildObject(converted);

        await xsdValidator.validateXML(xml, 'test/service/S124.xsd', (err, result) => {
            expect(err).toBeFalsy();
            if (err) {
                throw err;
            }
            expect(result.valid).toBe(true);
        });
    });
}));
