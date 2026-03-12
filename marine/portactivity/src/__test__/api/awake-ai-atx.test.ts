import { describe, expect, test, vi } from "vitest";
import type { WebSocket } from "ws";
import {
  AwakeAiATXApi,
  AwakeAiATXEventType,
  SUBSCRIPTION_MESSAGE,
} from "../../api/awake-ai-atx.js";
import { newAwakeATXMessage } from "../testdata.js";

const NO_OP = vi.fn();

const mockSubscriptionId = "abc";

vi.spyOn(AwakeAiATXApi.prototype, "getFromParameterStore").mockResolvedValue(
  mockSubscriptionId,
);
vi.spyOn(AwakeAiATXApi.prototype, "putInParameterStore").mockResolvedValue({});

describe("api-awake-ai-atx", () => {
  test("getATXs - no existing session subscribes to zone events", async () => {
    vi.spyOn(AwakeAiATXApi.prototype, "getFromParameterStore")
      // assume parameter store to not contain subscriptionId on first call
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue(mockSubscriptionId);

    const sendMock = vi.fn();
    const ws = vi.fn(
      class {
        on = vi.fn((event: string, callback: () => void) => {
          if (event === "open") {
            callback();
          }
        });
        send = sendMock;
        close = NO_OP;
      },
    );

    const api = new AwakeAiATXApi("", "", ws as unknown as typeof WebSocket);
    await api.getATXs(10);

    expect(sendMock.mock.calls[0]![0]).toEqual(
      JSON.stringify(SUBSCRIPTION_MESSAGE),
    );
  });

  test("getATXs - existing session resumes with subscription id", async () => {
    const sendMock = vi.fn();
    const subscriptionId = mockSubscriptionId;

    const ws = vi.fn(
      class {
        on = vi.fn((event: string, callback: (str?: string) => void) => {
          if (event === "open") {
            callback();
          } else if (event === "message") {
            callback(
              JSON.stringify({
                subscriptionId,
                msgType: AwakeAiATXEventType.SUBSCRIPTION_STATUS,
              }),
            );
          }
        });
        send = sendMock;
        close = NO_OP;
      },
    );

    const api = new AwakeAiATXApi("", "", ws as unknown as typeof WebSocket);

    await api.getATXs(10);
    await api.getATXs(10);

    expect(sendMock.mock.calls[1]![0]).toEqual(
      JSON.stringify(AwakeAiATXApi.createResumeMessage(subscriptionId)),
    );
  });

  test("getATXs - received ATxs", async () => {
    const atxMessage = newAwakeATXMessage();

    const ws = vi.fn(
      class {
        on = vi.fn((event: string, callback: (str?: string) => void) => {
          if (event === "open") {
            callback();
          } else if (event === "message") {
            callback(JSON.stringify(atxMessage));
          }
        });
        send = NO_OP;
        close = NO_OP;
      },
    );

    const api = new AwakeAiATXApi("", "", ws as unknown as typeof WebSocket);

    const atxs = await api.getATXs(10);

    expect(atxs.length).toBe(1);
    expect(atxs[0]).toMatchObject(atxMessage);
  });

  test("getATXs - error handling", async () => {
    const ws = vi.fn(
      class {
        on = vi.fn((event: unknown, callback: (str?: unknown) => void) => {
          if (event === "error") {
            callback(new Error("test error"));
          }
        });
        send = NO_OP;
        close = NO_OP;
      },
    );

    const api = new AwakeAiATXApi("", "", ws as unknown as typeof WebSocket);

    await expect(api.getATXs(10)).rejects.toEqual("Error");
  });
});
