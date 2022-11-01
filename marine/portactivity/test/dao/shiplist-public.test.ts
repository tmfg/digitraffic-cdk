import moment from "moment";
import { dbTestBase, insert } from "../db-testutil";
import { newTimestamp } from "../testdata";
import { EventType } from "../../lib/model/timestamp";
import { findByLocodePublicShiplist } from "../../lib/dao/shiplist-public";
import { EventSource } from "../../lib/model/eventsource";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { randomBoolean } from "@digitraffic/common/dist/test/testutils";

describe(
    "db-shiplist-public",
    dbTestBase((db: DTDatabase) => {
        const DEFAULT_INTERVAL = 4 * 24;

        test("findByLocodePublicShiplist - ETA not returned if ATA exists", async () => {
            const locode = "AA123";
            const portcallId = 1;
            const timestamp1 = newTimestamp({
                eventType: EventType.ETA,
                locode,
                eventTime: new Date(),
                source: EventSource.PORTNET,
                portcallId,
            });
            const timestamp2 = newTimestamp({
                eventType: EventType.ATA,
                locode,
                eventTime: moment().add(1, "hours").toDate(),
                source: "S1",
                portcallId,
            });
            await insert(db, [timestamp1, timestamp2]);

            const foundTimestamps = await findByLocodePublicShiplist(
                db,
                locode,
                DEFAULT_INTERVAL
            );

            expect(foundTimestamps.length).toBe(1);
            expect(foundTimestamps[0].event_type).toBe(EventType.ATA);
        });

        test("findByLocodePublicShiplist - ETA without portcallId returned even if ATA exists", async () => {
            const locode = "AA123";
            const portcallId = 1;
            const timestamp1 = newTimestamp({
                eventType: EventType.ETA,
                locode,
                eventTime: new Date(),
                source: EventSource.PORTNET,
            });
            const timestamp2 = newTimestamp({
                eventType: EventType.ATA,
                locode,
                eventTime: moment().add(1, "hours").toDate(),
                source: "S1",
                portcallId,
            });
            await insert(db, [timestamp1, timestamp2]);

            const foundTimestamps = await findByLocodePublicShiplist(
                db,
                locode,
                DEFAULT_INTERVAL
            );

            expect(foundTimestamps.length).toBe(2);
            expect(foundTimestamps[0].event_type).toBe(EventType.ETA);
            expect(foundTimestamps[1].event_type).toBe(EventType.ATA);
        });

        test("findByLocodePublicShiplist - ETA and ETD", async () => {
            const locode = "AA123";
            const portcallId = 1;
            const timestamp1 = newTimestamp({
                eventType: EventType.ETA,
                locode,
                eventTime: new Date(),
                source: EventSource.PORTNET,
                portcallId,
            });
            const timestamp2 = newTimestamp({
                eventType: EventType.ETD,
                locode,
                eventTime: moment().add(1, "hours").toDate(),
                source: "S1",
                portcallId,
            });
            await insert(db, [timestamp1, timestamp2]);

            const foundTimestamps = await findByLocodePublicShiplist(
                db,
                locode,
                DEFAULT_INTERVAL
            );

            expect(foundTimestamps.length).toBe(2);
            expect(foundTimestamps[0].event_type).toBe(EventType.ETA);
            expect(foundTimestamps[1].event_type).toBe(EventType.ETD);
        });

        test("findByLocodePublicShiplist - timestamps 4 days in the future", async () => {
            const locode = "AA123";
            const portcallId = 1;
            const timestamp = newTimestamp({
                eventType: randomBoolean() ? EventType.ETA : EventType.ETD,
                locode,
                eventTime: moment().add(4, "day").toDate(),
                source: EventSource.PORTNET,
                portcallId,
            });
            await insert(db, [timestamp]);

            await new Promise((resolve) => setTimeout(resolve, 1500));

            const foundTimestamps = await findByLocodePublicShiplist(
                db,
                locode,
                DEFAULT_INTERVAL + 1
            );

            expect(foundTimestamps.length).toBe(1);
        });

        test("findByLocodePublicShiplist - outgoing pilotages are included", async () => {
            const destLocode = "AA123";
            const fromLocode = "BB456";
            const portcallId = 1;
            const timestamp = newTimestamp({
                eventType: EventType.ETA,
                locode: destLocode,
                from: fromLocode,
                eventTime: new Date(),
                source: EventSource.PILOTWEB,
                portcallId,
            });
            await insert(db, [timestamp]);

            const foundTimestamps = await findByLocodePublicShiplist(
                db,
                fromLocode,
                DEFAULT_INTERVAL
            );

            expect(foundTimestamps.length).toBe(1);
        });
    })
);
