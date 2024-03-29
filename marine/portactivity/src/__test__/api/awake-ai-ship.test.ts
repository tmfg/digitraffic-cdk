import { AwakeAiETAShipApi, AwakeAiShipResponseType } from "../../api/awake-ai-ship";

describe("Awake.AI ETA ship API", () => {
    test("handleError - no response", () => {
        const ret = AwakeAiETAShipApi.handleError({});

        expect(ret.type).toBe(AwakeAiShipResponseType.NO_RESPONSE);
    });

    test("handleError - ship not found", () => {
        const ret = AwakeAiETAShipApi.handleError({ response: { status: 404 } });

        expect(ret.type).toBe(AwakeAiShipResponseType.SHIP_NOT_FOUND);
    });

    test("handleError - invalid ship id", () => {
        const ret = AwakeAiETAShipApi.handleError({ response: { status: 422 } });

        expect(ret.type).toBe(AwakeAiShipResponseType.INVALID_SHIP_ID);
    });

    test("handleError - server error", () => {
        const ret = AwakeAiETAShipApi.handleError({ response: { status: 500 } });

        expect(ret.type).toBe(AwakeAiShipResponseType.SERVER_ERROR);
    });

    test("handleError - unknown", () => {
        const ret = AwakeAiETAShipApi.handleError({ response: { status: 123 } });

        expect(ret.type).toBe(AwakeAiShipResponseType.UNKNOWN);
    });
});
