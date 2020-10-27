import {parseOperation, SubscriptionOperation} from "../../../lib/subscriptions/smsutils";

describe('smsutils', () => {

    test('parseOperation - unknown', () => {
        const op = parseOperation({originationNumber: '123', messageBody: 'TEST'});
        expect(op).toBe(SubscriptionOperation.INVALID);
    });

    test('parseOperation - subscribe', () => {
        const op = parseOperation({originationNumber: '123', messageBody: 'SUBSCRIBE'});
        expect(op).toBe(SubscriptionOperation.SUBSCRIBE);
    });

    test('parseOperation - remove', () => {
        const op = parseOperation({originationNumber: '123', messageBody: 'REMOVE'});
        expect(op).toBe(SubscriptionOperation.REMOVE);
    });

    test('parseOperation - help', () => {
        const op = parseOperation({originationNumber: '123', messageBody: 'HELP'});
        expect(op).toBe(SubscriptionOperation.HELP);
    });

    test('parseOperation - list', () => {
        const op = parseOperation({originationNumber: '123', messageBody: 'LIST'});
        expect(op).toBe(SubscriptionOperation.LIST);
    });

});
