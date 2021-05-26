import * as pgPromise from "pg-promise";
import {dbTestBase} from "../db-testutil";
import {deletePilotages, getTimestamps, updatePilotages} from "../../lib/db/pilotages";

describe('db-pilotages-public', dbTestBase((db: pgPromise.IDatabase<any, any>) => {
    test('getTimestamps - empty', async () => {
        const timestampMap = await getTimestamps(db);

        expect(Object.keys(timestampMap).length).toBe(0);
    });

    test('getTimestamps - one', async () => {
        const now = new Date();
        await insertPilotage(db, 1, 'ACTIVE', now);

        const timestampMap = await getTimestamps(db);

        expect(Object.keys(timestampMap).length).toBe(1);
        expect(timestampMap[1]).toStrictEqual(now);

        // update it to finished, so it should not show up
        await insertPilotage(db, 1, 'FINISHED', now);

        const timestampMap2 = await getTimestamps(db);

        expect(Object.keys(timestampMap2).length).toBe(0);
    });

    test('deletePilotages - none', async () => {
        await deletePilotages(db, []);
    });

    test('deletePilotages - one', async () => {
        const now = new Date();
        await insertPilotage(db, 1, 'ACTIVE', now);
        await insertPilotage(db, 2, 'ACTIVE', now);

        const timestampMap = await getTimestamps(db);
        expect(Object.keys(timestampMap).length).toBe(2);

        // delete one
        await deletePilotages(db, [1]);
        const timestampMap2 = await getTimestamps(db);

        expect(Object.keys(timestampMap2).length).toBe(1);
        expect(timestampMap2[2]).toStrictEqual(now);
    });
}));

export function insertPilotage(db: pgPromise.IDatabase<any, any>, id: number, state: string, scheduleUpdated: Date): Promise<any> {
    return updatePilotages(db, [{
        id,
        vessel: {
            name: 'test',
            imo: 1,
            mmsi: 1,
        },
        vesselEta: new Date().toISOString(),
        pilotBoardingTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        scheduleUpdated: scheduleUpdated.toISOString(),
        scheduleSource: 'test',
        state,
        route: {
            start: {
                code: 'START'
            },
            end: {
                code: 'END'
            }
        }
    }]);
}
