import {newAwakeATXMessage} from "../testdata";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const WebSocket = require('ws');
jest.mock('ws');
import {
    AwakeAiATXApi,
    AwakeAiATXEventType,
    SUBSCRIPTION_MESSAGE,
} from "../../lib/api/awake_ai_atx";

function NO_OP(): void {
    // intentionally empty
}

describe('api-awake-ai-atx', () => {

    beforeEach(() => {
        WebSocket.mockClear();
    });

    test('getATXs - no existing session subscribes to zone events', async () => {
        const sendMock = jest.fn();
        WebSocket.mockImplementation(() => ({
            on: (event: string, callback: () => void) => {
                if (event === 'open') {
                    callback();
                }
            },
            send: sendMock,
            close: NO_OP,
        }));
        const api = new AwakeAiATXApi('', '', WebSocket);

        await api.getATXs(10);

        expect(sendMock.mock.calls[0][0]).toEqual(JSON.stringify(SUBSCRIPTION_MESSAGE));
    });

    test('getATXs - existing session resumes with subscription id', async () => {
        const sendMock = jest.fn();
        const subscriptionId = 'foo';
        WebSocket.mockImplementation(() => ({
            on: (event: string, callback: (str?: string) => void) => {
                if (event === 'open') {
                    callback();
                } else if (event === 'message') {
                    callback(JSON.stringify({
                        subscriptionId,
                        msgType: AwakeAiATXEventType.SUBSCRIPTION_STATUS,
                    }));
                }
            },
            send: sendMock,
            close: NO_OP,
        }));
        const api = new AwakeAiATXApi('', '', WebSocket);

        await api.getATXs(10);
        await api.getATXs(10);

        expect(sendMock.mock.calls[1][0]).toEqual(JSON.stringify(AwakeAiATXApi.createResumeMessage(subscriptionId)));
    });

    test('getATXs - received ATxs', async () => {
        const atxMessage = newAwakeATXMessage();
        const sendMock = jest.fn();
        WebSocket.mockImplementation(() => ({
            on: (event: string, callback: (str?: string) => void) => {
                if (event === 'open') {
                    callback();
                } else if (event === 'message') {
                    callback(JSON.stringify(atxMessage));
                }
            },
            send: sendMock,
            close: NO_OP,
        }));
        const api = new AwakeAiATXApi('', '', WebSocket);

        const atxs = await api.getATXs(10);

        expect(atxs.length).toBe(1);
        expect(atxs[0]).toMatchObject(atxMessage);
    });

    test('getATXs - error handling', async () => {
        const sendMock = jest.fn();
        WebSocket.mockImplementation(() => ({
            on: () => {
                throw new Error('test error');
            },
            send: sendMock,
            close: NO_OP,
        }));
        const api = new AwakeAiATXApi('', '', WebSocket);

        await expect(async () => api.getATXs(10)).rejects.toThrow();
    });

});
