import type { HTTPError } from "ky";
import {
  AwakeAiPortApi,
  AwakeAiPortResponseType,
} from "../../api/awake-ai-port.js";

describe("Awake.AI ETA port API", () => {
  test("handleError - no response", () => {
    const ret = AwakeAiPortApi.handleError({} as HTTPError);

    expect(ret.type).toBe(AwakeAiPortResponseType.NO_RESPONSE);
  });

  test("handleError - ship not found", () => {
    const ret = AwakeAiPortApi.handleError(
      { response: { status: 404 } } as HTTPError,
    );

    expect(ret.type).toBe(AwakeAiPortResponseType.PORT_NOT_FOUND);
  });

  test("handleError - invalid ship id", () => {
    const ret = AwakeAiPortApi.handleError(
      { response: { status: 422 } } as HTTPError,
    );

    expect(ret.type).toBe(AwakeAiPortResponseType.INVALID_LOCODE);
  });

  test("handleError - server error", () => {
    const ret = AwakeAiPortApi.handleError(
      { response: { status: 500 } } as HTTPError,
    );

    expect(ret.type).toBe(AwakeAiPortResponseType.SERVER_ERROR);
  });

  test("handleError - unknown", () => {
    const ret = AwakeAiPortApi.handleError(
      { response: { status: 123 } } as HTTPError,
    );

    expect(ret.type).toBe(AwakeAiPortResponseType.UNKNOWN);
  });
});
