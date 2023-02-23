import { newAwakeATXMessage } from "../testdata";
import * as AWS from "aws-sdk";
import {
    AwakeAiATXApi,
    AwakeAiATXEventType,
    SUBSCRIPTION_MESSAGE,
} from "../../lib/api/awake_ai_atx";

const NO_OP = jest.fn();

const mockSSMData = jest.fn(() => ({
    Parameter: {
        Value: "abc",
    },
}));

const mockSSM = {
    getParameter: jest.fn(() => ({
        promise: mockSSMData,
    })),
    putParameter: jest.fn(() => ({
        promise: jest.fn(() => Promise.resolve()),
    })),
};

jest.mock("aws-sdk", () => {
    return {
        SSM: jest.fn(() => mockSSM),
    };
});

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

        // assume parameter store to not contain subscriptionId on first run
        (AWS.SSM as unknown as jest.MockedFn<jest.Mock>).mockReturnValueOnce({
            ...mockSSM,
            getParameter: jest.fn(() => ({
                promise: jest.fn(() => ({
                    Parameter: {
                        Value: undefined,
                    },
                })),
            })),
        });

        const api = new AwakeAiATXApi("", "", WebSocket, new AWS.SSM());

        await api.getATXs(10);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(sendMock.mock.calls[0][0]).toEqual(
            JSON.stringify(SUBSCRIPTION_MESSAGE)
        );
    });

    test("getATXs - existing session resumes with subscription id", async () => {
        const sendMock = jest.fn();
        const subscriptionId = mockSSMData().Parameter.Value;
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
        const api = new AwakeAiATXApi("", "", WebSocket, new AWS.SSM());

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
        const api = new AwakeAiATXApi("", "", WebSocket, new AWS.SSM());

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
        jest.mock("aws-sdk", () => {
            return {
                SSM: jest.fn(() => mockSSM),
            };
        });
        const api = new AwakeAiATXApi("", "", WebSocket, new AWS.SSM());

        await expect(api.getATXs(10)).rejects.toEqual("Error");
    });
});
