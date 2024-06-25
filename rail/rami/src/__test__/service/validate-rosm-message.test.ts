import _ from "lodash";
import { validateIncomingRosmMessage } from "../../service/validate-message.js";
import { validRamiMonitoredJourneyScheduledMessage } from "../testdata-rosm.js";
import { copyAndUndefine, undefine } from "../message-util.js";

describe("validate incoming rami message", () => {
    test("validateIncomingRamiMessage - invalid scheduledMessage", () => {
        const invalidMessage = _.set(
            _.cloneDeep(validRamiMonitoredJourneyScheduledMessage),
            ["payload", "messageId"],
            undefined
        );
        _.set(
            invalidMessage,
            ["payload", "scheduledMessage", "onGroundRecipient", "deliveryPoints"],
            undefined
        );

        const result = validateIncomingRosmMessage(invalidMessage);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toMatch(/payload must have required property 'messageId'/);
            expect(result.errors).toMatch(
                /payload\/scheduledMessage\/onGroundRecipient must have required property 'deliveryPoints'/
            );
        }
    });
    test("validateIncomingRamiMessage - invalid monitoredJourneyScheduledMessage", () => {
        const invalidMessage = copyAndUndefine(validRamiMonitoredJourneyScheduledMessage, "payload", "messageId");
        undefine(invalidMessage, "payload", "messageVersion");
        _.set(invalidMessage, ["payload", "monitoredJourneyScheduledMessage", "deliveryPoints", 0], {
            id: 0,
            nameLong: "abc"
        });

        const result = validateIncomingRosmMessage(invalidMessage);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toMatch(/payload must have required property 'messageId'/);
            expect(result.errors).toMatch(/payload must have required property 'messageVersion'/);
            expect(result.errors).toMatch(
                /payload\/monitoredJourneyScheduledMessage\/deliveryPoints\/0\/id must be string/
            );
        }
    });

    test("validateIncomingRamiMessage - valid scheduledMessage", () => {
        const result = validateIncomingRosmMessage(validRamiMonitoredJourneyScheduledMessage);
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.value).toEqual(validRamiMonitoredJourneyScheduledMessage);
    });

    test("validateIncomingRamiMessage - valid monitoredJourneyScheduledMessage", () => {
        const result = validateIncomingRosmMessage(validRamiMonitoredJourneyScheduledMessage);
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.value).toEqual(validRamiMonitoredJourneyScheduledMessage);
    });
});
