import { AwakeAiPortApi, AwakeAiPortResponseType } from "../../api/awake-ai-port";

describe("Awake.AI ETA port API", () => {
    test("handleError - no response", () => {
        const ret = AwakeAiPortApi.handleError({});

        expect(ret.type).toBe(AwakeAiPortResponseType.NO_RESPONSE);
    });

    test("handleError - ship not found", () => {
        const ret = AwakeAiPortApi.handleError({ response: { status: 404 } });

        expect(ret.type).toBe(AwakeAiPortResponseType.PORT_NOT_FOUND);
    });

    test("handleError - invalid ship id", () => {
        const ret = AwakeAiPortApi.handleError({ response: { status: 422 } });

        expect(ret.type).toBe(AwakeAiPortResponseType.INVALID_LOCODE);
    });

    test("handleError - server error", () => {
        const ret = AwakeAiPortApi.handleError({ response: { status: 500 } });

        expect(ret.type).toBe(AwakeAiPortResponseType.SERVER_ERROR);
    });

    test("handleError - unknown", () => {
        const ret = AwakeAiPortApi.handleError({ response: { status: 123 } });

        expect(ret.type).toBe(AwakeAiPortResponseType.UNKNOWN);
    });
});
