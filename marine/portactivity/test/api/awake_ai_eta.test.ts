import {AwakeAiETAApi, AwakeAiETAResponseType} from "../../lib/api/awake_ai_eta";

describe('api-awake_ai', () => {

   test('handleError - no response', () => {
       const ret = AwakeAiETAApi.handleError({});

       expect(ret.type).toBe(AwakeAiETAResponseType.NO_RESPONSE);
   });

    test('handleError - ship not found', () => {
        const ret = AwakeAiETAApi.handleError({ response: { status: 404 } });

        expect(ret.type).toBe(AwakeAiETAResponseType.SHIP_NOT_FOUND);
    });

    test('handleError - invalid ship id', () => {
        const ret = AwakeAiETAApi.handleError({ response: { status: 422 } });

        expect(ret.type).toBe(AwakeAiETAResponseType.INVALID_SHIP_ID);
    });

    test('handleError - server error', () => {
        const ret = AwakeAiETAApi.handleError({ response: { status: 500 } });

        expect(ret.type).toBe(AwakeAiETAResponseType.SERVER_ERROR);
    });

    test('handleError - unknown', () => {
        const ret = AwakeAiETAApi.handleError({ response: { status: 123 } });

        expect(ret.type).toBe(AwakeAiETAResponseType.UNKNOWN);
    });

});
