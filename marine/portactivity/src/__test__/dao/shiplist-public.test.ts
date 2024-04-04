import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { randomBoolean } from "@digitraffic/common/dist/test/testutils";
import { addDays, addHours, addMinutes, parseISO } from "date-fns";
import { findByLocodePublicShiplist } from "../../dao/shiplist-public.js";
import { mergeTimestamps } from "../../event-sourceutil.js";
import { EventSource } from "../../model/eventsource.js";
import { EventType } from "../../model/timestamp.js";
import { dbPublicShiplistToPublicApiTimestamp, getShiplist } from "../../service/shiplist.js";
import { dbTestBase, insert } from "../db-testutil.js";
import { assertDefined } from "../test-utils.js";
import { newTimestamp } from "../testdata.js";

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
                portcallId
            });
            const timestamp2 = newTimestamp({
                eventType: EventType.ATA,
                locode,
                eventTime: addHours(Date.now(), 1),
                source: "S1",
                portcallId
            });
            await insert(db, [timestamp1, timestamp2]);

            const foundTimestamp = (await findByLocodePublicShiplist(db, locode, DEFAULT_INTERVAL))[0];
            assertDefined(foundTimestamp);

            expect(foundTimestamp.event_type).toBe(EventType.ATA);
        });

        test("findByLocodePublicShiplist - ETA without portcallId returned even if ATA exists", async () => {
            const locode = "AA123";
            const portcallId = 1;
            const timestamp1 = newTimestamp({
                eventType: EventType.ETA,
                locode,
                eventTime: new Date(),
                source: EventSource.PORTNET
            });
            const timestamp2 = newTimestamp({
                eventType: EventType.ATA,
                locode,
                eventTime: addHours(Date.now(), 1),
                source: "S1",
                portcallId
            });
            await insert(db, [timestamp1, timestamp2]);

            const foundTimestamps = await findByLocodePublicShiplist(db, locode, DEFAULT_INTERVAL);
            expect(foundTimestamps).toHaveLength(2);

            const ata = foundTimestamps[0];
            const eta = foundTimestamps[1];
            assertDefined(ata);
            assertDefined(eta);

            expect(ata.event_type).toBe(EventType.ETA);
            expect(eta.event_type).toBe(EventType.ATA);
        });

        test("findByLocodePublicShiplist - ETA and ETD", async () => {
            const locode = "AA123";
            const portcallId = 1;
            const timestamp1 = newTimestamp({
                eventType: EventType.ETA,
                locode,
                eventTime: new Date(),
                source: EventSource.PORTNET,
                portcallId
            });
            const timestamp2 = newTimestamp({
                eventType: EventType.ETD,
                locode,
                eventTime: addHours(Date.now(), 1),
                source: "S1",
                portcallId
            });
            await insert(db, [timestamp1, timestamp2]);

            const foundTimestamps = await findByLocodePublicShiplist(db, locode, DEFAULT_INTERVAL);
            expect(foundTimestamps).toHaveLength(2);

            const eta = foundTimestamps[0];
            const etd = foundTimestamps[1];
            assertDefined(eta);
            assertDefined(etd);

            expect(eta.event_type).toBe(EventType.ETA);
            expect(etd.event_type).toBe(EventType.ETD);
        });

        test("findByLocodePublicShiplist - timestamps 4 days in the future", async () => {
            const locode = "AA123";
            const portcallId = 1;
            const timestamp = newTimestamp({
                eventType: randomBoolean() ? EventType.ETA : EventType.ETD,
                locode,
                eventTime: addDays(Date.now(), 4),
                source: EventSource.PORTNET,
                portcallId
            });
            await insert(db, [timestamp]);

            await new Promise((resolve) => setTimeout(resolve, 1500));

            const foundTimestamps = await findByLocodePublicShiplist(db, locode, DEFAULT_INTERVAL + 1);

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
                portcallId
            });
            await insert(db, [timestamp]);

            const foundTimestamps = await findByLocodePublicShiplist(db, fromLocode, DEFAULT_INTERVAL);

            expect(foundTimestamps.length).toBe(1);
        });

        test("findByLocodePublicShiplist - mergeTimestamps", async () => {
            const locode = "FIXXX";
            const portcallId = 12345678;
            const vtsTimestamp = newTimestamp({
                eventType: EventType.ETA,
                eventTime: new Date(),
                source: EventSource.SCHEDULES_CALCULATED,
                locode,
                portcallId
            });
            const awakeTimestamp = newTimestamp({
                eventType: EventType.ETA,
                eventTime: addMinutes(new Date(), 30),
                source: EventSource.AWAKE_AI,
                locode,
                portcallId
            });
            await insert(db, [vtsTimestamp, awakeTimestamp]);

            const foundTimestamps = await findByLocodePublicShiplist(db, locode, DEFAULT_INTERVAL);
            const mergedTimestamp = mergeTimestamps(
                foundTimestamps.map((ts) => dbPublicShiplistToPublicApiTimestamp(ts, locode))
            )[0];
            assertDefined(mergedTimestamp);

            expect(foundTimestamps).toHaveLength(2);
            expect(parseISO(mergedTimestamp.eventTime).valueOf()).toBeGreaterThan(
                parseISO(vtsTimestamp.eventTime).valueOf()
            );
            expect(parseISO(mergedTimestamp.eventTime).valueOf()).toBeLessThan(
                parseISO(awakeTimestamp.eventTime).valueOf()
            );
        });

        test("getShiplist - correct", async () => {
            const locode = "FIXXX";
            const portcallId = 12345678;
            const vtsTimestamp = newTimestamp({
                eventType: EventType.ETA,
                eventTime: new Date(),
                source: EventSource.SCHEDULES_CALCULATED,
                locode,
                portcallId
            });
            const awakeTimestamp = newTimestamp({
                eventType: EventType.ETA,
                eventTime: addMinutes(new Date(), 30),
                source: EventSource.AWAKE_AI,
                locode,
                portcallId
            });
            await insert(db, [vtsTimestamp, awakeTimestamp]);

            const shiplist = (await getShiplist(db, locode, 100))[0];
            assertDefined(shiplist);

            expect(parseISO(shiplist.eventTime).valueOf()).toBeGreaterThan(
                parseISO(vtsTimestamp.eventTime).valueOf()
            );
            expect(parseISO(shiplist.eventTime).valueOf()).toBeLessThan(
                parseISO(awakeTimestamp.eventTime).valueOf()
            );
        });
    })
);
