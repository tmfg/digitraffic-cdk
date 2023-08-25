import { validateIncomingRamiMessage } from "../../service/validate-message";
import {
    invalidRamiMonitoredJourneyScheduledMessage,
    invalidRamiScheduledMessage,
    validRamiMonitoredJourneyScheduledMessage,
    validRamiScheduledMessage
} from "../testdata";

describe("validate incoming rami message", () => {
    test("validateIncomingRamiMessage - invalid scheduledMessage", () => {
        const result = validateIncomingRamiMessage(invalidRamiScheduledMessage);
        expect(result.valid).toBe(false);
        if (!result.valid) expect(result.errors).toMatch(/payload must have required property 'messageId'/);
    });
    test("validateIncomingRamiMessage - invalid monitoredJourneyScheduledMessage", () => {
        const result = validateIncomingRamiMessage(invalidRamiMonitoredJourneyScheduledMessage);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toMatch(/payload must have required property 'messageId'/);
            expect(result.errors).toMatch(/payload must have required property 'messageVersion'/);
            expect(result.errors).toMatch(/id must be string/);
        }
    });

    test("validateIncomingRamiMessage - valid scheduledMessage", () => {
        const result = validateIncomingRamiMessage(validRamiScheduledMessage);
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.value).toEqual(validRamiScheduledMessage);
    });

    test("validateIncomingRamiMessage - valid monitoredJourneyScheduledMessage", () => {
        const result = validateIncomingRamiMessage(validRamiMonitoredJourneyScheduledMessage);
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.value).toEqual(validRamiMonitoredJourneyScheduledMessage);
    });
});
