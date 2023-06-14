import { findAll, mapBitsToDays } from "../../dao/message";
import { parseMessage, processMessage } from "../../service/message";
import { dbTestBase } from "../db-testutil";
import {
    invalidRamiScheduledMessage,
    validRamiMonitoredJourneyScheduledMessage,
    validRamiScheduledMessage
} from "../testdata";

describe("parse message", () => {
    test("parseMessage - valid monitoredJourneyScheduledMessage is correctly parsed", () => {
        const processedMessage = parseMessage(validRamiMonitoredJourneyScheduledMessage);
        console.log(JSON.stringify(processedMessage, null, 2));
        expect(processedMessage?.id).toEqual(validRamiMonitoredJourneyScheduledMessage.payload.messageId);
    });

    test("parseMessage - valid scheduledMessage is correctly parsed", () => {
        const processedMessage = parseMessage(validRamiScheduledMessage);
        console.log(JSON.stringify(processedMessage, null, 2));
        expect(processedMessage?.id).toEqual(validRamiScheduledMessage.payload.messageId);
    });

    test("parseMessage - invalid message is correctly parsed", () => {
        const processedMessage = parseMessage(invalidRamiScheduledMessage);
        expect(processedMessage).not.toBeDefined();
    });
});

describe(
    "process parsed message",
    dbTestBase(() => {
        test("processMessage - insert", async () => {
            const message = parseMessage(validRamiMonitoredJourneyScheduledMessage);
            if (message) await processMessage(message);
            const result = await findAll();

            console.log(JSON.stringify((result as any)[0][0]));

            expect((result as any)[0][0]["id"]).toEqual(message?.id);
            expect((result as any)[0][0]["stations"].split(",").sort()).toEqual(message?.stations?.sort());
        });
        test("processMessage - update", async () => {
            const message = parseMessage(validRamiScheduledMessage);
            if (message) await processMessage(message);
            const result = await findAll();

            console.log(JSON.stringify((result as any)[0][0]));

            expect((result as any)[0][0]["id"]).toEqual(message?.id);
            expect(mapBitsToDays((result as any)[0][0]["video_days"]).sort()).toEqual(
                message?.video?.daysOfWeek?.sort()
            );
        });
        test("processMessage - delete", async () => {
            const message = parseMessage(validRamiScheduledMessage);
            if (message) {
                await processMessage(message);
                await processMessage({ ...message, version: message.version + 1, operation: "UPDATE" });
                await processMessage({ ...message, operation: "DELETE" });
            }
            const result = await findAll();

            console.log(JSON.stringify((result as any)[0][0]));

            expect((result as any)[0][0]["id"]).toEqual(message?.id);
            expect((result as any)[0][0]["version"]).toEqual(message?.version);
            expect((result as any)[0][0]["deleted"]).not.toBeNull();

            expect((result as any)[0][1]["id"]).toEqual(message?.id);
            expect((result as any)[0][1]["version"]).toEqual((message?.version as unknown as number) + 1);
            expect((result as any)[0][1]["deleted"]).not.toBeNull();
        });
    })
);
