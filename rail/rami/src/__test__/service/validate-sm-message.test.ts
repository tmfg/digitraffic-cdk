import { validateIncomingSmMessage } from "../../service/validate-message.js";
import { validSmMessage } from "../testdata-sm.js";
import { copyAndUndefine } from "../message-util.js";

describe("validate incoming sm message", () => {
    test("validateIncomingSmMessage - missing schemaVersion", () => {
        const invalidMessage = copyAndUndefine(validSmMessage, "schemaVersion");

        const result = validateIncomingSmMessage(invalidMessage);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toMatch(/must have required property 'schemaVersion'/);            
        }
    });

    test("validateIncomingSmMessage - missing monitoredStopVisits", () => {
        const invalidMessage = copyAndUndefine(validSmMessage, "stopMonitoringMsg", "payload", "monitoredStopVisits");

        const result = validateIncomingSmMessage(invalidMessage);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toMatch(/payload must have required property 'monitoredStopVisits'/);            
        }
    });

    test("validateIncomingSmMessage - valid scheduledMessage", () => {
        const result = validateIncomingSmMessage(validSmMessage);

        if(!result.valid) {
            console.info(result.errors);
        }

        expect(result.valid).toBe(true);
        if (result.valid) expect(result.value).toEqual(validSmMessage);
    });    
});
