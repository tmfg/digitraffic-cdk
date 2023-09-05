import { newAwakeATXMessage } from "../testdata";
import * as API from "../../lib/api/awake-ai-atx";

const NO_OP = jest.fn();

const mockSubscriptionId = "abc";
jest.spyOn(API, "getFromParameterStore").mockResolvedValue(mockSubscriptionId);
jest.spyOn(API, "putInParameterStore").mockImplementation(jest.fn());

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
            close: NO_OP
        }));

        // assume parameter store to not contain subscriptionId on first run
        (API.getFromParameterStore as unknown as jest.MockedFn<jest.Mock>).mockReturnValueOnce(undefined);

        const api = new API.AwakeAiATXApi("", "", WebSocket);

        await api.getATXs(10);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(sendMock.mock.calls[0][0]).toEqual(JSON.stringify(API.SUBSCRIPTION_MESSAGE));
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
                            msgType: API.AwakeAiATXEventType.SUBSCRIPTION_STATUS
                        })
                    );
                }
            },
            send: sendMock,
            close: NO_OP
        }));
        const api = new API.AwakeAiATXApi("", "", WebSocket);

        await api.getATXs(10);
        await api.getATXs(10);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(sendMock.mock.calls[1][0]).toEqual(
            JSON.stringify(API.AwakeAiATXApi.createResumeMessage(subscriptionId))
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
            close: NO_OP
        }));
        const api = new API.AwakeAiATXApi("", "", WebSocket);

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
        }));
        const api = new API.AwakeAiATXApi("", "", WebSocket);

        await expect(api.getATXs(10)).rejects.toEqual("Error");
    });
});
