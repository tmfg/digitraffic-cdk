import { jest } from "@jest/globals";
import { newAwakeATXMessage } from "../testdata.js";
import type { WebSocket } from "ws";
import { AwakeAiATXApi, AwakeAiATXEventType, SUBSCRIPTION_MESSAGE } from "../../api/awake-ai-atx.js";

const NO_OP = jest.fn();

const mockSubscriptionId = "abc";

jest.spyOn(AwakeAiATXApi.prototype, "getFromParameterStore").mockResolvedValue(mockSubscriptionId);
jest.spyOn(AwakeAiATXApi.prototype, "putInParameterStore").mockResolvedValue({});

describe("api-awake-ai-atx", () => {
    test("getATXs - no existing session subscribes to zone events", async () => {
        jest.spyOn(AwakeAiATXApi.prototype, "getFromParameterStore")
            // assume parameter store to not contain subscriptionId on first call
            .mockResolvedValueOnce(undefined)
            .mockResolvedValue(mockSubscriptionId);

        const sendMock = jest.fn();
        const WebSocket = jest.fn().mockImplementation(() => ({
            on: (event: string, callback: () => void) => {
                if (event === "open") {
                    callback();
                }
            },
            send: sendMock,
            close: NO_OP
        })) as new (url: string | URL) => WebSocket;

        const api = new AwakeAiATXApi("", "", WebSocket);
        await api.getATXs(10);

        if (sendMock.mock.calls[0]) {
            expect(sendMock.mock.calls[0][0]).toEqual(JSON.stringify(SUBSCRIPTION_MESSAGE));
        } else {
            fail();
        }
    });

    test("getATXs - existing session resumes with subscription id", async () => {
        const sendMock = jest.fn();
        const subscriptionId = mockSubscriptionId;
        const WebSocket = jest.fn().mockImplementation(() => ({
            on: (event: string, callback: (str?: string) => void) => {
                if (event === "open") {
                    callback();
                } else if (event === "message") {
                    callback(
                        JSON.stringify({
                            subscriptionId,
                            msgType: AwakeAiATXEventType.SUBSCRIPTION_STATUS
                        })
                    );
                }
            },
            send: sendMock,
            close: NO_OP
        })) as new (url: string | URL) => WebSocket;
        const api = new AwakeAiATXApi("", "", WebSocket);

        await api.getATXs(10);
        await api.getATXs(10);

        if (sendMock.mock.calls[1]) {
            expect(sendMock.mock.calls[1][0]).toEqual(
                JSON.stringify(AwakeAiATXApi.createResumeMessage(subscriptionId))
            );
        } else {
            fail();
        }
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
            close: NO_OP
        })) as new (url: string | URL) => WebSocket;
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
            close: NO_OP
        })) as new (url: string | URL) => WebSocket;
        const api = new AwakeAiATXApi("", "", WebSocket);

        await expect(api.getATXs(10)).rejects.toEqual("Error");
    });
});
