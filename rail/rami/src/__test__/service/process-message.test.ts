import _ from "lodash";
import { RamiMessageOperations } from "../../model/rami-message.js";
import { getActiveMessages } from "../../service/get-message.js";
import { parseMessage, processMessage } from "../../service/process-message.js";
import { dbTestBase } from "../db-testutil.js";
import { validRamiMonitoredJourneyScheduledMessage, validRamiScheduledMessage } from "../testdata.js";
import { createMonitoredJourneyScheduledMessage, createScheduledMessage } from "../testdata-util.js";

describe("parse message", () => {
    test("parseMessage - valid monitoredJourneyScheduledMessage is correctly parsed", () => {
        const processedMessage = parseMessage(validRamiMonitoredJourneyScheduledMessage);
        expect(processedMessage?.id).toEqual(validRamiMonitoredJourneyScheduledMessage.payload.messageId);
    });

    test("parseMessage - valid scheduledMessage is correctly parsed", () => {
        const processedMessage = parseMessage(validRamiScheduledMessage);
        expect(processedMessage?.id).toEqual(validRamiScheduledMessage.payload.messageId);
    });

    test("parseMessage - invalid message is correctly parsed", () => {
        const invalidMessage = _.set(
            _.cloneDeep(validRamiMonitoredJourneyScheduledMessage),
            ["payload", "messageId"],
            undefined
        );
        const processedMessage = parseMessage(invalidMessage);
        expect(processedMessage).not.toBeDefined();
    });
});

describe(
    "process message",
    dbTestBase(() => {
        test("processMessage - insert valid monitoredJourneyScheduledMessage", async () => {
            const message = parseMessage(createMonitoredJourneyScheduledMessage({}));
            if (!message) fail();
            await processMessage(message);

            const activeMessages = await getActiveMessages();
            expect(activeMessages.length).toEqual(1);
            expect(activeMessages[0]?.id).toEqual(message.id);
        });
        test("processMessage - insert valid scheduledMessage", async () => {
            const message = parseMessage(createScheduledMessage({}));
            if (!message) fail();
            await processMessage(message);

            const activeMessages = await getActiveMessages();
            expect(activeMessages.length).toEqual(1);
            expect(activeMessages[0]?.id).toEqual(message.id);
        });
        test("processMessage - update valid message", async () => {
            const message = parseMessage(createScheduledMessage({ operation: RamiMessageOperations.INSERT }));
            if (!message) fail();
            const updatedMessage = {
                ...message,
                operation: RamiMessageOperations.UPDATE,
                version: message.version + 1
            };
            await processMessage(message);
            await processMessage(updatedMessage);

            const activeMessages = await getActiveMessages();
            expect(activeMessages.length).toEqual(1);
            expect(activeMessages[0]?.id).toEqual(message.id);
            expect(activeMessages[0]?.version).toEqual(updatedMessage.version);
        });
        test("processMessage - delete message", async () => {
            const message = parseMessage(createScheduledMessage({ operation: RamiMessageOperations.INSERT }));
            if (!message) fail();
            await processMessage(message);

            const activeMessages = await getActiveMessages();
            expect(activeMessages.length).toEqual(1);
            expect(activeMessages[0]?.id).toEqual(message.id);

            const deletedMessage = {
                ...message,
                operation: RamiMessageOperations.DELETE
            };
            await processMessage(deletedMessage);

            const activeMessagesAfterDelete = await getActiveMessages();
            expect(activeMessagesAfterDelete.length).toEqual(0);
        });
    })
);
