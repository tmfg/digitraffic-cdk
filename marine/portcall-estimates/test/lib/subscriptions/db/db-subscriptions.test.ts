import {getSubscriptionList, SUBSCRIPTIONS_TABLE_NAME, _ddb} from '../../../../lib/subscriptions/db/db-subscriptions';
import {newSubscription} from "../../testdata";

describe('subscriptions', () => {

    test('getSubscriptionList', async () => {
        const sub = newSubscription();
        await _ddb.put({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Item: sub
        }).promise();

        const subs = await getSubscriptionList(sub.PhoneNumber);

        expect(subs.Items.length).toBe(1);
        expect(subs.Items[0]).toMatchObject(sub);
    });

});
