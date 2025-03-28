import type { HTTPError } from "ky";
import {
  AwakeAiETAShipApi,
  AwakeAiShipResponseType,
} from "../../api/awake-ai-ship.js";

describe("Awake.AI ETA ship API", () => {
  test("handleError - no response", () => {
    const ret = AwakeAiETAShipApi.handleError({} as HTTPError);

    expect(ret.type).toBe(AwakeAiShipResponseType.NO_RESPONSE);
  });

  test("handleError - ship not found", () => {
    const ret = AwakeAiETAShipApi.handleError(
      { response: { status: 404 } } as HTTPError,
    );

    expect(ret.type).toBe(AwakeAiShipResponseType.SHIP_NOT_FOUND);
  });

  test("handleError - invalid ship id", () => {
    const ret = AwakeAiETAShipApi.handleError(
      { response: { status: 422 } } as HTTPError,
    );

    expect(ret.type).toBe(AwakeAiShipResponseType.INVALID_SHIP_ID);
  });

  test("handleError - server error", () => {
    const ret = AwakeAiETAShipApi.handleError(
      { response: { status: 500 } } as HTTPError,
    );

    expect(ret.type).toBe(AwakeAiShipResponseType.SERVER_ERROR);
  });

  test("handleError - unknown", () => {
    const ret = AwakeAiETAShipApi.handleError(
      { response: { status: 123 } } as HTTPError,
    );

    expect(ret.type).toBe(AwakeAiShipResponseType.UNKNOWN);
  });
});
