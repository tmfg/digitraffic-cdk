import {dbTestBase, findAll} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {createHash, saveMaintenanceTrackingData} from "../../../lib/service/maintenance-tracking";
import {assertData, getTrackingJson} from "../testdata";

describe('maintenance-tracking', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('saveMaintenanceTrackingData', async () => {
        const json = getTrackingJson('1', '1');
        await saveMaintenanceTrackingData(json);

        const fetchedTrackings = await findAll(db);
        expect(fetchedTrackings.length).toBe(1);
        const saved = fetchedTrackings[0];
        assertData(saved, json);
    });


    test('saveMaintenanceTrackingData should succeed for two different messages', async () => {
        const json1 = getTrackingJson('1', '456');
        const json2 = getTrackingJson('2', '654');
        await saveMaintenanceTrackingData(json1);
        await saveMaintenanceTrackingData(json2);

        const fetchedTrackings = await findAll(db);
        expect(fetchedTrackings.length).toBe(2);
    });


    test('saveMaintenanceTrackingData should succeed only for first message with same content and different id', async () => {
        const json1 = getTrackingJson('1', '1');
        const json2 = getTrackingJson('2', '1');
        await saveMaintenanceTrackingData(json1);

        let failure = false;
        try {
            await saveMaintenanceTrackingData(json2);
        } catch (error) {
            // Expect error: duplicate key value violates unique constraint "maintenance_tracking_data_hash_ui"
            failure = true;
        }

        expect(failure).toBe(true);

        const fetchedTrackings = await findAll(db);
        expect(fetchedTrackings.length).toBe(1);
        const saved = fetchedTrackings[0];
        assertData(saved, json1);
    });

    test('createHash should equals for same message but different viestintunniste id', () => {
        const h1 = createHash(getTrackingJson('1', '1'));
        const h2 = createHash(getTrackingJson('2', '1'));
        // Assert has is same for same json with different viestitunniste
        expect(h1).toBe(h2);
    });

    test('createHash should differ for different message', () => {
        const h1 = createHash(getTrackingJson('1', '123'));
        const h2 = createHash(getTrackingJson('1', '321'));
        // Assert has is not same for same json with different data content excluding viestitunniste
        expect(h1).not.toBe(h2);
    });

    test('getTrackingJson with viestintunniste id', () => {
        expect(getTrackingJson('1', '1')).toBe(getTrackingJson('1', '1'));
        expect(getTrackingJson('1', '1')).not.toBe(getTrackingJson('2', '1'));
    });

    test('getTrackingJson with viestintunniste and tyokone id', () => {
        expect(getTrackingJson('1', '123')).toBe(getTrackingJson('1', '123'));
        expect(getTrackingJson('1', '123')).not.toBe(getTrackingJson('1', '321'));
    });

    test('fifo', () => {
        const queueName = 'MaintenanceTrackingQueue.fifo';
        console.info(queueName.includes(".fifo"));
        console.info(queueName.endsWith(".fifo"));
        const fifoMessageGroupId = queueName.includes(".fifo") ? '&MessageGroupId=SameGroupAlways' : '';
        console.info(fifoMessageGroupId);
    });

}));
