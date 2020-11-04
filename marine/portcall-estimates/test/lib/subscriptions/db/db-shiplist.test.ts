import * as ShiplistDAO from '../../../../lib/subscriptions/db/db-shiplist';
import {inTransaction, dbTestBase} from "../../db-testutil";
import {updateEstimate} from "../../../../lib/estimates/db/db-estimates";
import {EventType} from "../../../../lib/estimates/model/estimate";

const TEST_MMSI = 12345;
const TEST_IMO = 67890;
const LOCODE_RAUMA = "FIRAU";
const LOCODE_HELSINKI = "FIHEL";

describe('shiplists', dbTestBase((db) => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 1);

    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);

    async function assertFindByLocode(t: any, locode: string, count: number) {
        const subs = await ShiplistDAO.findByLocode(t, startTime, endTime, locode);

        expect(subs.length).toBe(count);
    }

    async function assertFindByLocodeAndImo(t: any, locode: string, imo: number, count: number) {
        const subs = await ShiplistDAO.findByLocodeAndImo(t, startTime, endTime, locode, imo);
        expect(subs.length).toBe(count);
    }

   test('findByLocode - empty', inTransaction(db, async (t: any) => {
        await assertFindByLocode(t, LOCODE_RAUMA, 0);
    }));

    test('findByLocode - one', inTransaction(db, async (t: any) => {
        await updateEstimate(db, {
            eventTime:new Date().toISOString(),
            eventType:EventType.ETA,
            eventTimeConfidenceLower:null,
            eventTimeConfidenceUpper:null,
            recordTime:new Date().toISOString(),
            location: { port: LOCODE_RAUMA },
            ship: { mmsi: TEST_MMSI, imo: TEST_IMO },
            source: 'test'
        });

        assertFindByLocode(t, LOCODE_RAUMA, 1);
        assertFindByLocode(t, LOCODE_HELSINKI, 0);
    }));

    test('findByLocodeAndImo - one', inTransaction(db, async (t: any) => {
        await updateEstimate(db, {
            eventTime:new Date().toISOString(),
            eventType:EventType.ETA,
            eventTimeConfidenceLower:null,
            eventTimeConfidenceUpper:null,
            recordTime:new Date().toISOString(),
            location: { port: LOCODE_RAUMA },
            ship: { mmsi: TEST_MMSI, imo: TEST_IMO },
            source: 'test'
        });

        assertFindByLocode(t, LOCODE_RAUMA, 1);
        assertFindByLocodeAndImo(t, LOCODE_RAUMA, TEST_IMO, 1);
        assertFindByLocodeAndImo(t, LOCODE_RAUMA, TEST_IMO+1000, 0);
        assertFindByLocodeAndImo(t, LOCODE_HELSINKI, TEST_IMO, 0);
    }));

    test('findByLocode - no ATAs', inTransaction(db, async (t: any) => {
        await updateEstimate(db, {
            eventTime:new Date().toISOString(),
            eventType:EventType.ATA,
            eventTimeConfidenceLower:null,
            eventTimeConfidenceUpper:null,
            recordTime:new Date().toISOString(),
            location: { port: LOCODE_RAUMA },
            ship: { mmsi: TEST_MMSI, imo: TEST_IMO },
            source: 'test'
        });

        assertFindByLocode(t, LOCODE_RAUMA, 0);
    }));
}));
