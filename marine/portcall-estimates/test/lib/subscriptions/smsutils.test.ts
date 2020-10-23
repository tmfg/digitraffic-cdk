import {parseOperation, SubscriptionOperation} from "../../../lib/subscriptions/smsutils";

describe('smsutils', () => {

    test('parseOperation - unknown', () => {
        const locop = parseOperation({originationNumber: '123', messageBody: 'TEST'});

        expect(locop.operation).toBe(SubscriptionOperation.INVALID);
    });

});