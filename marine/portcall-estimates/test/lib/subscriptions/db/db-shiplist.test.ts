import * as pgPromise from "pg-promise"
import {findByLocode} from '../../../../lib/subscriptions/db/db-shiplist';
import {dbTestBase} from "../../db-testutil";

describe('shiplists', dbTestBase((db: pgPromise.IDatabase<any,any>) => {
    test('getSubscriptionList', async () => {
        const subs = await findByLocode(db, 'FIRAU');

        expect(subs.length).toBe(0);
    });
}));
