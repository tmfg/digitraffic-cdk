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
import {newNotification, newSubscription} from "../../testdata";
import {
    _ddb as ddb,
    DbShipsToNotificate,
    SUBSCRIPTIONS_TABLE_NAME
} from "../../../../lib/subscriptions/db/db-subscriptions";
import moment from 'moment';

type PinpointFunctionName = "sendSubscriptionOKMessage" | "sendValidationFailedMessage" | "sendNoSubscriptionsMessage" | "sendDifferenceNotification" | "sendSmsMessage" | "sendRemovalOKMessage";

const PHONE_NUMBER = "12345";

describe('subscriptions', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    function stubPinpoint(functionName: PinpointFunctionName): sinon.SinonStub {
        const sendStub = sandbox.stub(pps, functionName);
        sendStub.returns(Promise.resolve());

        return sendStub;
    }

    async function createDefaultSubscription() {
        const sub = newSubscription();
        await ddb.put({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Item: sub
        }).promise();

        return sub;
    }

    async function assertSendNotifications(sendStub: any, notification: any, estimateTime: moment.Moment) {
        await _createSendSmsNotications(<PinpointService> <unknown> pps)(notification, PHONE_NUMBER);

        expect(sendStub.calledWith(PHONE_NUMBER, 'PURKKI', 'ETA', estimateTime)).toBe(true);
    }

    test('valid addSubscription sends "subscription created" SMS', async () => {
        const sendStub = stubPinpoint('sendSubscriptionOKMessage');

        const sub = {
            phoneNumber: '+1234567890',
            locode: 'FIHKO',
            time: '07:00'
        };

        await _createAddSubscription(<PinpointService> <unknown> pps)(sub);

        expect(sendStub.calledWith(sub.phoneNumber)).toBe(true);
    });

    test('valid addSubscription sends "fail" SMS', async () => {
        const failedStub = stubPinpoint('sendValidationFailedMessage');

        const sub: EstimateSubscription = {
            phoneNumber: '+1234567890',
            locode: '39sdjf',
            time: 'a03rms'
        };

        await _createAddSubscription(<PinpointService> <unknown> pps)(sub);

        expect(failedStub.calledWith(sub.phoneNumber)).toBe(true);
    });

    test('removeSubscription sends "subscription removed" SMS', async () => {
        const okStub = stubPinpoint('sendRemovalOKMessage');

        const sub: EstimateRemoval = {
            phoneNumber: '+1234567890',
            locode: 'FIHKO'
        };

        await _createRemoveSubscription(<PinpointService> <unknown> pps)(sub);

        expect(okStub.calledWith(sub.phoneNumber)).toBe(true);
    });

    test('sendSubscriptionList sends "no subscriptions" SMS', async () => {
        const sendStub = stubPinpoint('sendNoSubscriptionsMessage');
        const phoneNumber = '+1234567890';

        await _createSendSubscriptionList(<PinpointService> <unknown> pps)(phoneNumber);

        expect(sendStub.calledWith(phoneNumber)).toBe(true);
    });

    test('sendSubscriptionList sends subscriptions SMS', async () => {
        const sendStub = stubPinpoint('sendSmsMessage');
        const sub = await createDefaultSubscription();

        await _createSendSubscriptionList(<PinpointService> <unknown> pps)(sub.PhoneNumber);

        expect(sendStub.calledWith(`${sub.Locode} ${sub.Time}`, sub.PhoneNumber)).toBe(true);
    });

    test('sendSmsNotications - new estimate sends notification SMS', async () => {
        const sendStub = stubPinpoint('sendDifferenceNotification');

        const estimateTime = moment();
        const notification = newNotification({
            "Portnet": estimateTime
        });
        notification[12333]["ETA"]["Sent"] = undefined;

        await assertSendNotifications(sendStub, notification, estimateTime);
    });

    test('sendSmsNotications - updated estimate sends notification SMS', async () => {
        const sendStub = stubPinpoint('sendDifferenceNotification');

        const estimateTime = moment().subtract(2, 'hours');
        const notification: DbShipsToNotificate = newNotification({
            "Portnet": estimateTime
        });

        await assertSendNotifications(sendStub, notification, estimateTime);
    });

    test('sendSmsNotications - send notification SMS - two estimates use VTS', async () => {
        const sendStub = stubPinpoint('sendDifferenceNotification');

        const portnetEstimateTime = moment().subtract(3, 'hours');
        const VTSEstimateTime = moment().subtract(2, 'hours');
        const notification: DbShipsToNotificate = newNotification({
            "Portnet": portnetEstimateTime,
            "VTS": VTSEstimateTime
        });

        assertSendNotifications(sendStub, notification, VTSEstimateTime);
    });

    test('sendSmsNotications - no need to update', async () => {
        const sendStub = stubPinpoint('sendDifferenceNotification');

        // only 15 minutes off, no need to notificate
        const estimateTime = moment().subtract(15, 'minutes');
        const notification: DbShipsToNotificate = newNotification({
            "Portnet": estimateTime,
        });

        await assertNoNotifications(sendStub, notification);
    });

    test('sendSmsNotications - no need to update - two estimates use VTS', async () => {
        const sendStub = stubPinpoint('sendDifferenceNotification');

        // VTS estimate is only 15 minutes off, no need to notificate
        const portnetEstimateTime = moment().subtract(2, 'hours');
        const VTSEstimateTime = moment().subtract(15, 'minutes');
        const notification: DbShipsToNotificate = newNotification({
            "Portnet": portnetEstimateTime,
            "VTS": VTSEstimateTime
        });

        await assertNoNotifications(sendStub, notification);
    });

    async function assertNoNotifications(sendStub: any, notification: any) {
        await _createSendSmsNotications(<PinpointService> <unknown> pps)(notification, PHONE_NUMBER);

        expect(sendStub.notCalled).toBe(true);
    }
}));
