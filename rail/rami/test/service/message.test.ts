import { processRamiMessage } from "../../lib/service/message";
import {
    invalidRamiScheduledMessage,
    validRamiMonitoredJourneyScheduledMessage,
    validRamiScheduledMessage
} from "../testdata";

describe("RAMI message processing", () => {
    test("processRamiMessage - valid monitoredJourneyScheduledMessage is correctly processed", () => {
        const processedMessage = processRamiMessage(validRamiMonitoredJourneyScheduledMessage);
        console.log(JSON.stringify(processedMessage, null, 2));
        expect(processedMessage?.id).toEqual(validRamiMonitoredJourneyScheduledMessage.payload.messageId);
    });

    test("processRamiMessage - valid scheduledMessage is correctly processed", () => {
        const processedMessage = processRamiMessage(validRamiScheduledMessage);
        console.log(JSON.stringify(processedMessage, null, 2));
        expect(processedMessage?.id).toEqual(validRamiScheduledMessage.payload.messageId);
    });

    test("processRamiMessage - invalid message is correctly processed", () => {
        const processedMessage = processRamiMessage(invalidRamiScheduledMessage);
        expect(processedMessage).not.toBeDefined();
    });
});
