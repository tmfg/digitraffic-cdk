import { validateIncomingSmMessage } from "../../service/validate-message.js";
import { validMessage2, validMessageUnknownTrackAndDelay } from "../testdata-sm.js";
import { copyAndUndefine } from "../message-util.js";

describe("validate incoming sm message", () => {
    test("validateIncomingSmMessage - missing payload", () => {
        const invalidMessage = copyAndUndefine(validMessageUnknownTrackAndDelay, "payload");

        const result = validateIncomingSmMessage(invalidMessage);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toMatch(/must have required property 'payload'/);
        }
    });

    test("validateIncomingSmMessage - missing monitoredStopVisits", () => {
        const invalidMessage = copyAndUndefine(validMessageUnknownTrackAndDelay, "stopMonitoringMsg", "payload", "monitoredStopVisits");

        const result = validateIncomingSmMessage(invalidMessage);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toMatch(/payload must have required property 'monitoredStopVisits'/);            
        }
    });

    test("validateIncomingSmMessage - valid scheduledMessage", () => {
        const result = validateIncomingSmMessage(validMessageUnknownTrackAndDelay);

        if(!result.valid) {
            console.info(result.errors);
        }

        expect(result.valid).toBe(true);
        if (result.valid) expect(result.value).toEqual(validMessageUnknownTrackAndDelay);
    });

    test("validateIncomingSmMessage - valid message with onwardCalls", () => {
        const result = validateIncomingSmMessage(validMessage2);

        if(!result.valid) {
            console.info(result.errors);
        }

        expect(result.valid).toBe(true);
        if (result.valid) expect(result.value).toEqual(validMessage2);
    });
});
