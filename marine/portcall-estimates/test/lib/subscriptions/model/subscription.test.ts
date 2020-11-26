import {EstimateSubscription, validateSubscription} from "../../../../lib/subscriptions/model/subscription";

describe('subscription', () => {

    test('validateSubscription - valid', () => {
        const sub: EstimateSubscription = {
            phoneNumber: '+1234567890',
            time: '12:00',
            locode: 'FIHKO'
        };

        expect(validateSubscription(sub)).toBe(true);
    });

    test('validateSubscription - invalid LOCODE', () => {
        const sub: EstimateSubscription = {
            phoneNumber: '+1234567890',
            time: '12:00',
            locode: 'TEST'
        };

        expect(validateSubscription(sub)).toBe(false);
    });

    test('validateSubscription - invalid time', () => {
        const sub: EstimateSubscription = {
            phoneNumber: '+1234567890',
            time: 'TEST',
            locode: 'FIHKO'
        };

        expect(validateSubscription(sub)).toBe(false);
    });

});