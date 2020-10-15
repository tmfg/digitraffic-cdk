import * as pgPromise from "pg-promise"
import {findByLocode} from '../../../../lib/subscriptions/db/db-shiplist';
import {dbTestBase} from "../../db-testutil";
import {updateEstimate} from "../../../../lib/estimates/db/db-estimates";
import {EventType} from "../../../../lib/estimates/model/estimate";

const TEST_MMSI = 12345;
const TEST_IMO = 67890;

describe('shiplists', dbTestBase((db: pgPromise.IDatabase<any,any>) => {
    test('getSubscriptionList - empty', async () => {
        const subs = await findByLocode(db, 'FIRAU');

        expect(subs.length).toBe(0);
    });

    test('getSubscriptionList - one', async() => {
        await updateEstimate(db, {
            eventTime:new Date().toISOString(),
            eventType:EventType.ETA,
            eventTimeConfidenceLower:null,
            eventTimeConfidenceUpper:null,
            recordTime:new Date().toISOString(),
            location: { port: "FIRAU" },
            ship: { mmsi: TEST_MMSI, imo: TEST_IMO },
            source: 'test'
        });

        const subs = await findByLocode(db, 'FIRAU');
        expect(subs.length).toBe(1);

        const subs2 = await findByLocode(db, 'FIHEL');
        expect(subs2.length).toBe(0);
    });
}));
