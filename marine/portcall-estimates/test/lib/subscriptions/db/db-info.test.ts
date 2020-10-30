import {_ddb as ddb} from '../../../../lib/subscriptions/db/db-subscriptions';
import {dynamoDbTestBase} from "../../db-testutil";
import {
    getInfo,
    ID_VALUE,
    increaseSmsSentAmount,
    increaseSmsReceivedAmount,
    INFO_TABLE_NAME
} from "../../../../lib/subscriptions/db/db-info";

describe('info', () => {

    test('getInfo', dynamoDbTestBase(ddb, async () => {
        const smsSentAmount = Math.floor(Math.random() * 1000);
        const smsReceivedAmount = Math.floor(Math.random() * 1000);
        await ddb.put({
            TableName: INFO_TABLE_NAME,
            Item: {
                ID: ID_VALUE,
                SmsSentAmount: smsSentAmount,
                SmsReceivedAmount: smsReceivedAmount
            }
        }).promise();

        const subs = await getInfo();

        expect(subs.Items.length).toBe(1);
        expect(subs.Items[0].SmsSentAmount).toBe(smsSentAmount);
        expect(subs.Items[0].SmsReceivedAmount).toBe(smsReceivedAmount);
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

    test('increaseSmsSentAmount', dynamoDbTestBase(ddb, async () => {
        const smsReceivedAmount = Math.floor(Math.random() * 1000);
        await ddb.put({
            TableName: INFO_TABLE_NAME,
            Item: {
                ID: ID_VALUE,
                SmsReceivedAmount: smsReceivedAmount
            }
        }).promise();

        await increaseSmsReceivedAmount();
        const subs = await ddb.scan({
            TableName: INFO_TABLE_NAME
        }).promise();

        expect(subs.Items![0].SmsReceivedAmount).toBe(smsReceivedAmount + 1);
    }));

});
