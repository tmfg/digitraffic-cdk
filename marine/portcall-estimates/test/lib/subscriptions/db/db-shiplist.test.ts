import * as pgPromise from "pg-promise"
import * as ShiplistDAO from '../../../../lib/subscriptions/db/db-shiplist';
import {dbTestBase} from "../../db-testutil";
import {updateEstimate} from "../../../../lib/estimates/db/db-estimates";
import {EventType} from "../../../../lib/estimates/model/estimate";

const TEST_MMSI = 12345;
const TEST_IMO = 67890;
const LOCODE_RAUMA = "FIRAU";
const LOCODE_HELSINKI = "FIHEL";

describe('shiplists', dbTestBase((db: pgPromise.IDatabase<any,any>) => {
    async function assertFindByLocode(locode: string, count: number) {
        const subs = await ShiplistDAO.findByLocode(db, new Date(), locode);

        expect(subs.length).toBe(count);
    }

    async function assertFindByLocodeAndImo(locode: string, imo: number, count: number) {
        const subs = await ShiplistDAO.findByLocodeAndImo(db, new Date(), locode, imo);

        expect(subs.length).toBe(count);
    }

    test('findByLocode - empty', async () => {
        await assertFindByLocode(LOCODE_RAUMA, 0);
    });

    test('findByLocode - one', async() => {
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

        assertFindByLocode(LOCODE_RAUMA, 1);
        assertFindByLocode(LOCODE_HELSINKI, 0);
    });

    test('findByLocodeAndImo - one', async() => {
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

        assertFindByLocodeAndImo(LOCODE_RAUMA, TEST_IMO, 1);
        assertFindByLocodeAndImo(LOCODE_RAUMA, TEST_IMO+1000, 0);
        assertFindByLocodeAndImo(LOCODE_HELSINKI, TEST_IMO, 0);
    });
}));
