import {_ddb as ddb} from '../../../../lib/subscriptions/db/db-subscriptions';
import {dynamoDbTestBase} from "../../db-testutil";
import {
    getInfo,
    getId,
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
                ID: getId(),
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
                ID: getId(),
                SmsSentAmount: smsSentAmount
            }
        }).promise();

        await increaseSmsSentAmount();
        const subs = await ddb.scan({
            TableName: INFO_TABLE_NAME
        }).promise();

        expect(subs.Items![0].SmsSentAmount).toBe(smsSentAmount + 1);
    }));

    test('increaseSmsReceivedAmount', dynamoDbTestBase(ddb, async () => {
        const smsReceivedAmount = Math.floor(Math.random() * 1000);
        await ddb.put({
            TableName: INFO_TABLE_NAME,
            Item: {
                ID: getId(),
                SmsReceivedAmount: smsReceivedAmount
            }
        }).promise();

        await increaseSmsReceivedAmount();
        const subs = await ddb.scan({
            TableName: INFO_TABLE_NAME
        }).promise();

        expect(subs.Items![0].SmsReceivedAmount).toBe(smsReceivedAmount + 1);
    }));

    test('increaseSmsSentAmount - creates non-existing row', dynamoDbTestBase(ddb, async () => {
        await increaseSmsSentAmount();
        const subs = await ddb.scan({
            TableName: INFO_TABLE_NAME
        }).promise();

        expect(subs.Items![0].SmsSentAmount).toBe(1);
    }));

    test('increaseSmsReceivedAmount - creates non-existing row', dynamoDbTestBase(ddb, async () => {
        await increaseSmsReceivedAmount();
        const subs = await ddb.scan({
            TableName: INFO_TABLE_NAME
        }).promise();

        expect(subs.Items![0].SmsReceivedAmount).toBe(1);
    }));

});
