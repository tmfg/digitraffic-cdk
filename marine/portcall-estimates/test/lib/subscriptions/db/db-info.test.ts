import {_ddb as ddb} from '../../../../lib/subscriptions/db/db-subscriptions';
import {dynamoDbTestBase} from "../../db-testutil";
import {
    getSmsSentAmount,
    ID_VALUE,
    increaseSmsSentAmount,
    INFO_TABLE_NAME
} from "../../../../lib/subscriptions/db/db-info";

describe('info', () => {

    test('getSmsSentAmount', dynamoDbTestBase(ddb, async () => {
        const smsSentAmount = Math.floor(Math.random() * 1000);
        await ddb.put({
            TableName: INFO_TABLE_NAME,
            Item: {
                ID: ID_VALUE,
                SmsSentAmount: smsSentAmount
            }
        }).promise();

        const subs = await getSmsSentAmount();

        expect(subs.Items.length).toBe(1);
        expect(subs.Items[0].SmsSentAmount).toBe(smsSentAmount);
    }));

    test('increaseSmsSentAmount', dynamoDbTestBase(ddb, async () => {
        const smsSentAmount = Math.floor(Math.random() * 1000);
        await ddb.put({
            TableName: INFO_TABLE_NAME,
            Item: {
                ID: ID_VALUE,
                SmsSentAmount: smsSentAmount
            }
        }).promise();

        await increaseSmsSentAmount();
        const subs = await ddb.scan({
            TableName: INFO_TABLE_NAME
        }).promise();

        expect(subs.Items![0].SmsSentAmount).toBe(smsSentAmount + 1);
    }));

});
