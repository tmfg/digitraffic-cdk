import {
    getSubscriptionList,
    insertSubscription,
    listSubscriptionsForTime,
    SUBSCRIPTIONS_TABLE_NAME,
    _ddb as ddb, removeSubscription
} from '../../../../lib/subscriptions/db/db-subscriptions';
import {newSubscription} from "../../testdata";
import {dynamoDbTestBase} from "../../db-testutil";

describe('subscriptions', () => {

    test('getSubscriptionList', dynamoDbTestBase(ddb, async () => {
        const sub = newSubscription();
        await ddb.put({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Item: sub
        }).promise();

        const subs = await getSubscriptionList(sub.PhoneNumber);

        expect(subs.Items.length).toBe(1);
        expect(subs.Items[0]).toMatchObject(sub);
    }));

    test('insertSubscription', dynamoDbTestBase(ddb, async () => {
        const sub = newSubscription();
        await insertSubscription(sub);

        const subs = await ddb.scan({
            TableName: SUBSCRIPTIONS_TABLE_NAME
        }).promise();
        expect(subs.Items!!.length).toBe(1);
        expect(subs.Items!![0]).toMatchObject(sub);
    }));

    test('listSubscriptionsForTime', dynamoDbTestBase(ddb, async () => {
        const sub = newSubscription();
        await ddb.put({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Item: sub
        }).promise();

        const subs = await listSubscriptionsForTime(sub.Time);
        expect(subs.Items!!.length).toBe(1);
        expect(subs.Items!![0]).toMatchObject(sub);
    }));

    test('removeSubscription', dynamoDbTestBase(ddb, async () => {
        const sub = newSubscription();
        await ddb.put({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Item: sub
        }).promise();

        await removeSubscription(sub.PhoneNumber, sub.Locode);
        const subs = await ddb.scan({
            TableName: SUBSCRIPTIONS_TABLE_NAME
        }).promise();

        expect(subs.Items!!.length).toBe(0);
    }));

});
