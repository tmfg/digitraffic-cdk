import {dynamoDbTestBase} from '../../db-testutil';
import {_ddb as ddb, SUBSCRIPTIONS_TABLE_NAME} from '../../../../lib/subscriptions/db/db-subscriptions';
import {handler} from '../../../../lib/subscriptions/lambda/create-subscription/lambda-create-subscription';

describe('create-subscription', () => {

    test('subscribe - valid', dynamoDbTestBase(ddb, async () => {
        await handler({
            phoneNumber: '+1234567890',
            locode: 'FIHKO',
            time: '07:00'
        });

        const subs = await ddb.scan({
            TableName: SUBSCRIPTIONS_TABLE_NAME
        }).promise();

        expect(subs.Items!!.length).toBe(1);
    }));

    test('subscribe - invalid LOCODE', dynamoDbTestBase(ddb, async () => {
        await handler({
            phoneNumber: '+1234567890',
            locode: 'TEST',
            time: '07:00'
        });

        const subs = await ddb.scan({
            TableName: SUBSCRIPTIONS_TABLE_NAME
        }).promise();

        expect(subs.Items!!.length).toBe(0);
    }));

    test('subscribe - invalid time', dynamoDbTestBase(ddb, async () => {
        await handler({
            phoneNumber: '+1234567890',
            locode: 'FIHKO',
            time: 'TEST'
        });

        const subs = await ddb.scan({
            TableName: SUBSCRIPTIONS_TABLE_NAME
        }).promise();

        expect(subs.Items!!.length).toBe(0);
    }));

});
