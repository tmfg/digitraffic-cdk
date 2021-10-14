import {dbTestBase, insertActiveWarnings, insertArchivedWarnings} from "../db-testutil";
import {IDatabase} from "pg-promise";
import {getActiveWarnings, getArchivedWarnings, updateNauticalWarnings} from "../../lib/service/nautical-warnings";
import * as sinon from "sinon";
import {NauticalWarningsApi} from "../../lib/api/nautical-warnings";

const TEST_ACTIVE_WARNINGS = {test1: 'test1'};
const TEST_ARCHIVED_WARNINGS = {test2: 'test2'};

describe('nautical-warnings', dbTestBase((db: IDatabase<any, any>) => {
    test('getActiveWarnings - empty', async () => {
        const warnings = await getActiveWarnings();
        expect(warnings).toEqual(null);
    });

    test('getActiveWarnings - value', async () => {
        await insertActiveWarnings(db, TEST_ACTIVE_WARNINGS);
        const warnings = await getActiveWarnings();
        expect(warnings).toEqual(TEST_ACTIVE_WARNINGS);
    });

    test('getArchivedWarnings - empty', async () => {
        const warnings = await getArchivedWarnings();
        expect(warnings).toEqual(null);
    });

    test('getArchivedWarnings - value', async () => {
        await insertArchivedWarnings(db, TEST_ARCHIVED_WARNINGS);
        const warnings = await getArchivedWarnings();
        expect(warnings).toEqual(TEST_ARCHIVED_WARNINGS);
    });

    test('updateNauticalWarnings', async () => {
        sinon.stub(NauticalWarningsApi.prototype, 'getActiveWarnings').returns(Promise.resolve(TEST_ACTIVE_WARNINGS));
        sinon.stub(NauticalWarningsApi.prototype, 'getArchivedWarnings').returns(Promise.resolve(TEST_ARCHIVED_WARNINGS));

        await updateNauticalWarnings('any');

        const active = await getActiveWarnings();
        expect(active).toEqual(TEST_ACTIVE_WARNINGS);

        const archived = await getArchivedWarnings();
        expect(archived).toEqual(TEST_ARCHIVED_WARNINGS);
    });
}));
