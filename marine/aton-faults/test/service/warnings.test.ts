import {dbTestBase, insertActiveWarnings, TEST_ACTIVE_WARNINGS_VALID} from "../db-testutil";
import {IDatabase} from "pg-promise";
import {findWarningsForVoyagePlan} from "../../lib/service/warnings";
import {voyagePlan} from "../testdata";
import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import util from "util";
import * as xml2js from "xml2js";

// XML validation takes a while
jest.setTimeout(30000);

const parseXml = util.promisify(xml2js.parseString);

describe('warnings-service', dbTestBase((db: IDatabase<any, any>) => {

    async function findWarnings() {
        const rtz = (await parseXml(voyagePlan)) as RtzVoyagePlan;

        return await findWarningsForVoyagePlan(rtz);
    }

    test('findWarningsForVoyagePlan - empty', async () => {
        const warnings = await findWarnings();
        expect(warnings).toEqual(null);
    });

    test('findWarningsForVoyagePlan - one warning', async () => {
        expect(TEST_ACTIVE_WARNINGS_VALID.features).toHaveLength(7);
        await insertActiveWarnings(db, TEST_ACTIVE_WARNINGS_VALID);

        const warnings = await findWarnings();
        // one feature is in the path
        expect(warnings?.features).toHaveLength(2);
    });
}));
