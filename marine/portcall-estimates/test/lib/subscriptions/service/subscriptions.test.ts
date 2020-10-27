import {dbTestBase} from "../../db-testutil";
import * as pgPromise from "pg-promise";
import {_createAddSubscription} from "../../../../lib/subscriptions/service/subscriptions";
import {default as pps, PinpointService} from '../../../../lib/subscriptions/service/pinpoint';
import * as sinon from 'sinon';

describe('subscriptions', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('valid addSubscription sends "subscription created" SMS', async () => {
        const sendStub = sinon.stub(pps, 'sendSubscriptionOKMessage');
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
        const failStub = sinon.stub(pps, 'sendValidationFailedMessage');
        failStub.returns(Promise.resolve());
        const sub = {
            phoneNumber: '+1234567890',
            locode: '39sdjf',
            time: 'a03rms'
        };

        await _createAddSubscription(<PinpointService> <unknown> pps)(sub);

        expect(failStub.calledWith(sub.phoneNumber)).toBe(true);
    });


}));
