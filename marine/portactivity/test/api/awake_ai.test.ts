import {AwakeAiApi, AwakeAiResponseType} from "../../lib/api/awake_ai";

describe('api-awake_ai', () => {

   test('handleError - no response', () => {
       const ret = AwakeAiApi.handleError({});

       expect(ret.type).toBe(AwakeAiResponseType.NO_RESPONSE);
   });

    test('handleError - ship not found', () => {
        const ret = AwakeAiApi.handleError({ response: { status: 404 } });

        expect(ret.type).toBe(AwakeAiResponseType.SHIP_NOT_FOUND);
    });

    test('handleError - invalid ship id', () => {
        const ret = AwakeAiApi.handleError({ response: { status: 422 } });

        expect(ret.type).toBe(AwakeAiResponseType.INVALID_SHIP_ID);
    });

    test('handleError - server error', () => {
        const ret = AwakeAiApi.handleError({ response: { status: 500 } });

        expect(ret.type).toBe(AwakeAiResponseType.SERVER_ERROR);
    });

    test('handleError - unknown', () => {
        const ret = AwakeAiApi.handleError({ response: { status: 123 } });

        expect(ret.type).toBe(AwakeAiResponseType.UNKNOWN);
    });

});
