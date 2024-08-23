import { jest } from "@jest/globals";
import { validMessageUnknownTrackAndDelay } from "../testdata-sm.js";
import { cloneAndUndefine } from "../message-util.js";

const sendSmFn = jest.fn();
const sendDlqFn = jest.fn();

jest.unstable_mockModule("../../service/sqs-service.js", () => ({
    sendSmMessage: sendSmFn,
    sendDlq: sendDlqFn
}));

describe(
    "upload-sm-message lambda",
    () => {
        test("handler - empty message", async () => {
            const handler = await import("../../lambda/upload-sm-message/upload-sm-message.js");
            const result = await handler.handler(undefined);

            expect(result.status).toEqual(400);
            expect(sendSmFn).toHaveBeenCalledTimes(0);
            expect(sendDlqFn).toHaveBeenCalledTimes(0);
        });

        test("handler - valid message", async () => {
            const handler = await import("../../lambda/upload-sm-message/upload-sm-message.js");
            const result = await handler.handler(validMessageUnknownTrackAndDelay);

            expect(result.status).toEqual(200);
            expect(sendSmFn).toHaveBeenCalledTimes(1);
            expect(sendDlqFn).toHaveBeenCalledTimes(0);
        });
    }
);