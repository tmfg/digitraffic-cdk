import {dbTestBase} from "../../db-testutil";
import * as pgPromise from "pg-promise";
import {
    _createAddSubscription,
    _createRemoveSubscription, _createSendSmsNotications,
    _createSendSubscriptionList
} from "../../../../lib/subscriptions/service/subscriptions";
import {default as pps, PinpointService} from '../../../../lib/subscriptions/service/pinpoint';
import * as sinon from 'sinon';
import {EstimateRemoval, EstimateSubscription} from "../../../../lib/subscriptions/model/subscription";
import {newSubscription} from "../../testdata";
import {
    _ddb as ddb,
    DbShipsToNotificate,
    SUBSCRIPTIONS_TABLE_NAME
} from "../../../../lib/subscriptions/db/db-subscriptions";
import moment from 'moment';

describe('subscriptions', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());
    
    test('valid addSubscription sends "subscription created" SMS', async () => {
        const sendStub = sandbox.stub(pps, 'sendSubscriptionOKMessage');
        sendStub.returns(Promise.resolve());
        const sub = {
            phoneNumber: '+1234567890',
            locode: 'FIHKO',
            time: '07:00'
        };

        await _createAddSubscription(<PinpointService> <unknown> pps)(sub);

        expect(sendStub.calledWith(sub.phoneNumber)).toBe(true);
    });

    test('valid addSubscription sends "fail" SMS', async () => {
        const Stub = sandbox.stub(pps, 'sendValidationFailedMessage');
        Stub.returns(Promise.resolve());
        const sub: EstimateSubscription = {
            phoneNumber: '+1234567890',
            locode: '39sdjf',
            time: 'a03rms'
        };

        await _createAddSubscription(<PinpointService> <unknown> pps)(sub);

        expect(Stub.calledWith(sub.phoneNumber)).toBe(true);
    });

    test('removeSubscription sends "subscription removed" SMS', async () => {
        const sendStub = sandbox.stub(pps, 'sendRemovalOKMessage');
        sendStub.returns(Promise.resolve());
        const sub: EstimateRemoval = {
            phoneNumber: '+1234567890',
            locode: 'FIHKO'
        };

        await _createRemoveSubscription(<PinpointService> <unknown> pps)(sub);

        expect(sendStub.calledWith(sub.phoneNumber)).toBe(true);
    });

    test('sendSubscriptionList sends "no subscriptions" SMS', async () => {
        const sendStub = sandbox.stub(pps, 'sendNoSubscriptionsMessage');
        sendStub.returns(Promise.resolve());
        const phoneNumber = '+1234567890';

        await _createSendSubscriptionList(<PinpointService> <unknown> pps)(phoneNumber);

        expect(sendStub.calledWith(phoneNumber)).toBe(true);
    });

    test('sendSubscriptionList sends subscriptions SMS', async () => {
        const sendStub = sandbox.stub(pps, 'sendSmsMessage');
        sendStub.returns(Promise.resolve());
        const sub = newSubscription();
        await ddb.put({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Item: sub
        }).promise();

        await _createSendSubscriptionList(<PinpointService> <unknown> pps)(sub.PhoneNumber);

        expect(sendStub.calledWith(`${sub.Locode} ${sub.Time}`, sub.PhoneNumber)).toBe(true);
    });

    test('sendSmsNotications - new estimate sends notification SMS', async () => {
        const sendStub = sandbox.stub(pps, 'sendDifferenceNotification');
        sendStub.returns(Promise.resolve());
        const sub = newSubscription();
        await ddb.put({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Item: sub
        }).promise();
        const estimateTime = moment().toISOString();
        const notification: DbShipsToNotificate = {
            '12333': {
               'name': 'PURKKI',
                'ETA': {
                   'Portnet': estimateTime
                }
            }
        };

        await _createSendSmsNotications(<PinpointService> <unknown> pps)(notification, sub.PhoneNumber);

        expect(sendStub.calledWith(sub.PhoneNumber, 'PURKKI', 'ETA', moment(estimateTime))).toBe(true);
    });

    test('sendSmsNotications - updated estimate sends notification SMS', async () => {
        const sendStub = sandbox.stub(pps, 'sendDifferenceNotification');
        sendStub.returns(Promise.resolve());
        const sub = newSubscription();
        await ddb.put({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Item: sub
        }).promise();
        const sentTime = moment().subtract(1, 'hours')
        const estimateTime = moment();
        const notification: DbShipsToNotificate = {
            '12333': {
                'name': 'PURKKI',
                'ETA': {
                    'Sent': sentTime,
                    'Portnet': estimateTime
                }
            }
        };

        await _createSendSmsNotications(<PinpointService> <unknown> pps)(notification, sub.PhoneNumber);

        expect(sendStub.calledWith(sub.PhoneNumber, 'PURKKI', 'ETA', estimateTime)).toBe(true);
    });

    test('sendSmsNotications - no need to update', async () => {
        const sendStub = sandbox.stub(pps, 'sendDifferenceNotification');
        sendStub.returns(Promise.resolve());
        const sub = newSubscription();
        await ddb.put({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Item: sub
        }).promise();
        const sentTime = moment().subtract(5, 'minutes')
        const estimateTime = moment();
        const notification: DbShipsToNotificate = {
            '12333': {
                'name': 'PURKKI',
                'ETA': {
                    'Sent': sentTime,
                    'Portnet': estimateTime
                }
            }
        };

        await _createSendSmsNotications(<PinpointService> <unknown> pps)(notification, sub.PhoneNumber);

        expect(sendStub.notCalled).toBe(true);
    });

}));
