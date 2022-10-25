import { newAwakeATXMessage } from "../testdata";

import {
    AwakeAiATXApi,
    AwakeAiATXEventType,
    SUBSCRIPTION_MESSAGE,
} from "../../lib/api/awake_ai_atx";

const NO_OP = jest.fn();

describe("api-awake-ai-atx", () => {
    test("getATXs - no existing session subscribes to zone events", async () => {
        const sendMock = jest.fn();
        const WebSocket = jest.fn().mockImplementation(() => ({
            on: (event: string, callback: () => void) => {
                if (event === "open") {
                    callback();
                }
            },
            send: sendMock,
            close: NO_OP,
        }));
        const api = new AwakeAiATXApi("", "", WebSocket);

        await api.getATXs(10);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(sendMock.mock.calls[0][0]).toEqual(
            JSON.stringify(SUBSCRIPTION_MESSAGE)
        );
    });

    test("getATXs - existing session resumes with subscription id", async () => {
        const sendMock = jest.fn();
        const subscriptionId = "foo";
        const WebSocket = jest.fn().mockImplementation(() => ({
            on: (event: string, callback: (str?: string) => void) => {
                if (event === "open") {
                    callback();
                } else if (event === "message") {
                    callback(
                        JSON.stringify({
                            subscriptionId,
                            msgType: AwakeAiATXEventType.SUBSCRIPTION_STATUS,
                        })
                    );
                }
            },
            send: sendMock,
            close: NO_OP,
        }));
        const api = new AwakeAiATXApi("", "", WebSocket);

        await api.getATXs(10);
        await api.getATXs(10);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(sendMock.mock.calls[1][0]).toEqual(
            JSON.stringify(AwakeAiATXApi.createResumeMessage(subscriptionId))
        );
    });

    test("getATXs - received ATxs", async () => {
        const atxMessage = newAwakeATXMessage();
        const WebSocket = jest.fn().mockImplementation(() => ({
            on: (event: string, callback: (str?: string) => void) => {
                if (event === "open") {
                    callback();
                } else if (event === "message") {
                    callback(JSON.stringify(atxMessage));
                }
            },
            send: jest.fn(),
            close: NO_OP,
        }));
        const api = new AwakeAiATXApi("", "", WebSocket);

        const atxs = await api.getATXs(10);

        expect(atxs.length).toBe(1);
        expect(atxs[0]).toMatchObject(atxMessage);
    });

    test("getATXs - error handling", async () => {
        const WebSocket = jest.fn().mockImplementation(() => ({
            on: (event: unknown, callback: (str?: unknown) => void) => {
                if (event === "error") {
                    callback(new Error("test error"));
                }
            },
            send: jest.fn(),
            close: NO_OP,
        }));
        const api = new AwakeAiATXApi("", "", WebSocket);

        await expect(api.getATXs(10)).rejects.toEqual("Error");
    });
});
