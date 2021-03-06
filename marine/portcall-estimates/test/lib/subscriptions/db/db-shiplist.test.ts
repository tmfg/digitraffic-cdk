import * as ShiplistDAO from '../../../../lib/subscriptions/db/db-shiplist';
import {dbTestBase, inTransaction} from "../../db-testutil";
import {updateEstimate} from "../../../../lib/estimates/db/db-estimates";
import {ApiEstimate, EventType} from "../../../../lib/estimates/model/estimate";
import {newEstimate} from "../../testdata";

const TEST_MMSI = 12345;
const TEST_IMO = 67890;
const LOCODE_RAUMA = "FIRAU";
const LOCODE_HELSINKI = "FIHEL";

const DEFAULT_ESTIMATE = {
    eventType: EventType.ETA,
    locode: LOCODE_RAUMA,
    portcallId: 1,
    mmsi: TEST_MMSI,
    imo: TEST_IMO,
};

describe('shiplists', dbTestBase((db) => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 1);

    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);

    async function assertFindByLocode(t: any, locode: string, count: number) {
        const subs = await ShiplistDAO.getShiplistForLocode(t, startTime, endTime, locode);

        expect(subs.length).toBe(count);
    }

    async function assertFindByLocodeAndImo(t: any, locode: string, imo: number, count: number) {
        const subs = await ShiplistDAO.findByLocodeAndImo(t, startTime, endTime, locode, imo);
        expect(subs.length).toBe(count);
    }

    async function createEstimate(override?: any): Promise<ApiEstimate> {
        const estimate = newEstimate({ ...DEFAULT_ESTIMATE, ...override});

        await updateEstimate(db, estimate);

        return estimate;
    }

   test('findByLocode - empty', inTransaction(db, async (t: any) => {
        await assertFindByLocode(t, LOCODE_RAUMA, 0);
    }));

    test('findByLocode - one', inTransaction(db, async (t: any) => {
        await createEstimate();

        assertFindByLocode(t, LOCODE_RAUMA, 1);
        assertFindByLocode(t, LOCODE_HELSINKI, 0);
    }));

    test('findByLocodeAndImo - one', inTransaction(db, async (t: any) => {
        await createEstimate();

        assertFindByLocode(t, LOCODE_RAUMA, 1);
        assertFindByLocodeAndImo(t, LOCODE_RAUMA, TEST_IMO, 1);
        assertFindByLocodeAndImo(t, LOCODE_RAUMA, TEST_IMO+1000, 0);
        assertFindByLocodeAndImo(t, LOCODE_HELSINKI, TEST_IMO, 0);
    }));

    test('findByLocodeAndImo - different sources', inTransaction(db, async (t: any) => {
        await createEstimate({source: 'VTS'});
        await createEstimate({source: 'PORTNET'});

        assertFindByLocode(t, LOCODE_RAUMA, 2);
    }));

    test('findByLocode - no ATAs', inTransaction(db, async (t: any) => {
        await createEstimate({eventType: EventType.ATA});

        assertFindByLocode(t, LOCODE_RAUMA, 0);
    }));
}));
