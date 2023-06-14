import { findAll, insertMessage, mapBitsToDays } from "../../dao/message";
import { parseMessage } from "../../service/message";
import { dbTestBase } from "../db-testutil";
import { validRamiMonitoredJourneyScheduledMessage, validRamiScheduledMessage } from "../testdata";

describe(
    "rami messages",
    dbTestBase(() => {
        test("insert valid monitoredJourneyScheduledMessage", async () => {
            const message = parseMessage(validRamiMonitoredJourneyScheduledMessage);
            if (message) await insertMessage(message);
            const result = await findAll();

            console.log(JSON.stringify((result as any)[0][0]));

            expect((result as any)[0][0]["id"]).toEqual(message?.id);
            expect((result as any)[0][0]["stations"].split(",").sort()).toEqual(message?.stations?.sort());
        });
        test("insert valid scheduledMessage", async () => {
            const message = parseMessage(validRamiScheduledMessage);
            if (message) await insertMessage(message);
            const result = await findAll();

            console.log(JSON.stringify((result as any)[0][0]));

            expect((result as any)[0][0]["id"]).toEqual(message?.id);
            expect(mapBitsToDays((result as any)[0][0]["video_days"]).sort()).toEqual(
                message?.video?.daysOfWeek?.sort()
            );
        });
    })
);
