import {dbTestBase, insertPilotage} from "../db-testutil";
import {deletePilotages, findPortCallId, getTimestamps, updatePilotages} from "../../lib/db/pilotages";
import {Pilotage} from "../../lib/model/pilotage";
import {Location} from "lib/model/timestamp";
import {DTDatabase} from "digitraffic-common/database/database";

describe('db-pilotages-public', dbTestBase((db: DTDatabase) => {
    function createPilotage(): Pilotage {
        return {
            id: 1,
            state: 'TEST',
            vessel: {
                name: 'test',
                mmsi: 123,
            },
            route: {
                start: {
                    code: 'ABC',
                },
                end: {
                    code: 'DEF',
                },
            },
            vesselEta: '',
            endTime: '',
            scheduleSource: 'test',
            scheduleUpdated: '',
        };
    }

    function createLocation(): Location {
        return {
            port: 'ABC',
        };
    }

    test('findPortCallId - empty', async () => {
        const pilotage = createPilotage();
        const location = createLocation();
        await findPortCallId(db, pilotage, location);
    });

    test('getTimestamps - empty', async () => {
        const timestampMap = await getTimestamps(db);

        expect(Object.keys(timestampMap)).toHaveLength(0);
    });

    test('getTimestamps - one', async () => {
        const now = new Date();
        await insertPilotage(db, 1, 'ACTIVE', now);

        const timestampMap = await getTimestamps(db);

        expect(Object.keys(timestampMap)).toHaveLength(1);
        expect(timestampMap[1]).toStrictEqual(now);

        // update it to finished, so it should not show up
        await insertPilotage(db, 1, 'FINISHED', now);

        const timestampMap2 = await getTimestamps(db);

        expect(Object.keys(timestampMap2)).toHaveLength(0);
    });

    test('deletePilotages - none', async () => {
        const removed = await deletePilotages(db, []);
        expect(removed).toHaveLength(0);
    });

    test('deletePilotages - one', async () => {
        const now = new Date();
        await insertPilotage(db, 1, 'ACTIVE', now);
        await insertPilotage(db, 2, 'ACTIVE', now);

        const timestampMap = await getTimestamps(db);
        expect(Object.keys(timestampMap)).toHaveLength(2);

        // delete one
        const deleted = await deletePilotages(db, [1]);
        const timestampMap2 = await getTimestamps(db);

        expect(deleted).toHaveLength(1);
        expect(Object.keys(timestampMap2)).toHaveLength(1);
        expect(timestampMap2[2]).toStrictEqual(now);
    });
}));
