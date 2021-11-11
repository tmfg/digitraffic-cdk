import {AwakeAiVoyagesApi, AwakeAiETAResponseType} from "../../lib/api/awake_ai_voyages";

describe('api-awake_ai', () => {

   test('handleError - no response', () => {
       const ret = AwakeAiVoyagesApi.handleError({});

       expect(ret.type).toBe(AwakeAiETAResponseType.NO_RESPONSE);
   });

    test('handleError - ship not found', () => {
        const ret = AwakeAiVoyagesApi.handleError({ response: { status: 404 } });

        expect(ret.type).toBe(AwakeAiETAResponseType.SHIP_NOT_FOUND);
    });

    test('handleError - invalid ship id', () => {
        const ret = AwakeAiVoyagesApi.handleError({ response: { status: 422 } });

        expect(ret.type).toBe(AwakeAiETAResponseType.INVALID_SHIP_ID);
    });

    test('handleError - server error', () => {
        const ret = AwakeAiVoyagesApi.handleError({ response: { status: 500 } });

        expect(ret.type).toBe(AwakeAiETAResponseType.SERVER_ERROR);
    });

    test('handleError - unknown', () => {
        const ret = AwakeAiVoyagesApi.handleError({ response: { status: 123 } });

        expect(ret.type).toBe(AwakeAiETAResponseType.UNKNOWN);
    });

});
