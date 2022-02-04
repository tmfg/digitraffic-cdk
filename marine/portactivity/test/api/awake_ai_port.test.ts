import {AwakeAiETAPortApi, AwakeAiPortResponseType} from "../../lib/api/awake_ai_port";

describe('Awake.AI ETA port API', () => {

    test('handleError - no response', () => {
        const ret = AwakeAiETAPortApi.handleError({});

        expect(ret.type).toBe(AwakeAiPortResponseType.NO_RESPONSE);
    });

    test('handleError - ship not found', () => {
        const ret = AwakeAiETAPortApi.handleError({ response: { status: 404 } });

        expect(ret.type).toBe(AwakeAiPortResponseType.PORT_NOT_FOUND);
    });

    test('handleError - invalid ship id', () => {
        const ret = AwakeAiETAPortApi.handleError({ response: { status: 422 } });

        expect(ret.type).toBe(AwakeAiPortResponseType.INVALID_LOCODE);
    });

    test('handleError - server error', () => {
        const ret = AwakeAiETAPortApi.handleError({ response: { status: 500 } });

        expect(ret.type).toBe(AwakeAiPortResponseType.SERVER_ERROR);
    });

    test('handleError - unknown', () => {
        const ret = AwakeAiETAPortApi.handleError({ response: { status: 123 } });

        expect(ret.type).toBe(AwakeAiPortResponseType.UNKNOWN);
    });

});
