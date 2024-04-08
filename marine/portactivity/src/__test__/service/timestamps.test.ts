import {
    dbTestBase,
    findAll,
    getPilotagesCount,
    insert,
    insertPilotage,
    insertPortAreaDetails,
    insertPortCall,
    insertVessel
} from "../db-testutil.js";
import { newPortAreaDetails, newPortCall, newTimestamp, newVessel } from "../testdata.js";
import * as TimestampsService from "../../service/timestamps.js";
import { EventType } from "../../model/timestamp.js";
import { EventSource } from "../../model/eventsource.js";
import _ from "lodash";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { addHours, addMinutes, parseISO, subDays } from "date-fns";
import { assertDefined } from "../test-utils.js";

describe(
    "timestamps",
    dbTestBase((db: DTDatabase) => {
        test("findAllTimestamps - locode", async () => {
            const timestamp = newTimestamp();
            await insert(db, [timestamp]);

            const timestamps = await TimestampsService.findAllTimestamps(
                timestamp.location.port,
                undefined,
                undefined
            );
            expect(timestamps).toHaveLength(1);
            expect(timestamps[0]).toMatchObject({
                ...timestamp,
                eventTimeConfidenceLowerDiff: null,
                eventTimeConfidenceUpperDiff: null
            });
        });

        test("findAllTimestamps - mmsi", async () => {
            const timestamp = newTimestamp();
            await insert(db, [timestamp]);

            const timestamps = await TimestampsService.findAllTimestamps(
                undefined,
                timestamp.ship.mmsi,
                undefined
            );

            expect(timestamps).toHaveLength(1);
            expect(timestamps[0]).toMatchObject({
                ...timestamp,
                eventTimeConfidenceLowerDiff: null,
                eventTimeConfidenceUpperDiff: null
            });
        });

        test("findAllTimestamps - imo", async () => {
            const timestamp = newTimestamp();
            await insert(db, [timestamp]);

            const timestamps = await TimestampsService.findAllTimestamps(
                undefined,
                undefined,
                timestamp.ship.imo
            );

            expect(timestamps).toHaveLength(1);
            expect(timestamps[0]).toMatchObject({
                ...timestamp,
                eventTimeConfidenceLowerDiff: null,
                eventTimeConfidenceUpperDiff: null
            });
        });

        test("findAllTimestamps - VTS A timestamps are merged", async () => {
            const portcallId = 1;
            const imo = 12345678;
            const earlier = new Date();
            const later = addMinutes(earlier, 30);
            const timestamps = [
                newTimestamp({
                    source: EventSource.AWAKE_AI,
                    imo,
                    portcallId,
                    eventType: EventType.ETA,
                    eventTime: earlier,
                    recordTime: earlier
                }),
                newTimestamp({
                    source: EventSource.SCHEDULES_CALCULATED,
                    imo,
                    portcallId,
                    eventType: EventType.ETA,
                    eventTime: later,
                    recordTime: later
                })
            ];

            await insert(db, timestamps);

            const foundTimestamp = (await TimestampsService.findAllTimestamps(undefined, undefined, imo))[0];

            assertDefined(foundTimestamp);
            // eventtime should be the average of the two eventtimes
            expect(parseISO(foundTimestamp.eventTime).valueOf()).toBeGreaterThan(earlier.valueOf());
            expect(parseISO(foundTimestamp.eventTime).valueOf()).toBeLessThan(later.valueOf());
            // recordtime should be from higher priority source
            expect(parseISO(foundTimestamp.recordTime).valueOf()).toEqual(later.valueOf());
        });

        test("saveTimestamp - no conflict returns updated", async () => {
            const timestamp = newTimestamp();
            const ret = await TimestampsService.saveTimestamp(timestamp, db);

            expect(ret?.location_locode).toBe(timestamp.location.port);
            expect(ret?.ship_mmsi).toBe(timestamp.ship.mmsi);
            expect(ret?.ship_imo).toBe(timestamp.ship.imo);
        });

        test("saveTimestamp - conflict returns undefined", async () => {
            const timestamp = newTimestamp();

            await TimestampsService.saveTimestamp(timestamp, db);
            const ret = await TimestampsService.saveTimestamp(timestamp, db);

            expect(ret).toBeUndefined();
        });

        test("saveTimestamp - Portnet timestamp with same portcallid, same locode is not replaced ", async () => {
            const olderTimestamp = newTimestamp({
                locode: "FIRAU",
                source: "Portnet"
            });
            const newerTimestamp = {
                ...olderTimestamp,
                eventTime: addHours(parseISO(olderTimestamp.eventTime), 1).toISOString()
            };

            await TimestampsService.saveTimestamp(olderTimestamp, db);
            const ret = await TimestampsService.saveTimestamp(newerTimestamp, db);

            expect(ret?.locodeChanged).toBe(false);
            expect(await findAll(db)).toHaveLength(2);
        });

        test("saveTimestamp - Portnet timestamp with same portcallid, different locode is replaced ", async () => {
            const olderTimestamp = newTimestamp({
                locode: "FIHKO",
                source: "Portnet"
            });
            const newerTimestamp = {
                ...olderTimestamp,
                location: { port: "FIRAU" }
            };

            await TimestampsService.saveTimestamp(olderTimestamp, db);
            const ret = await TimestampsService.saveTimestamp(newerTimestamp, db);

            expect(ret?.locodeChanged).toBe(true);
            expect((await TimestampsService.findAllTimestamps(olderTimestamp.location.port)).length).toBe(0);
            expect((await TimestampsService.findAllTimestamps(newerTimestamp.location.port)).length).toBe(1);
        });

        test("saveTimestamps - multiple updates", async () => {
            const timestamp1 = newTimestamp();
            const timestamp2 = newTimestamp();

            const ret = await TimestampsService.saveTimestamps([timestamp1, timestamp2]);

            expect(ret[0]?.location_locode).toBe(timestamp1.location.port);
            expect(ret[0]?.ship_mmsi).toBe(timestamp1.ship.mmsi);
            expect(ret[0]?.ship_imo).toBe(timestamp1.ship.imo);

            expect(ret[1]?.location_locode).toBe(timestamp2.location.port);
            expect(ret[1]?.ship_mmsi).toBe(timestamp2.ship.mmsi);
            expect(ret[1]?.ship_imo).toBe(timestamp2.ship.imo);
        });

        test("saveTimestamp - no IMO, timestamp not saved", async () => {
            const timestamp = _.omit(newTimestamp(), "ship.imo");

            const ret = await TimestampsService.saveTimestamp(timestamp, db);

            expect(ret).toBeUndefined();
        });

        test("saveTimestamp - no MMSI but IMO exists, timestamp saved", async () => {
            const timestamp = _.omit(newTimestamp(), "ship.mmsi");

            const ret = await TimestampsService.saveTimestamp(timestamp, db);

            expect(ret).toBeDefined();
        });

        test("saveTimestamp - imo from vessel", async () => {
            const timestamp = newTimestamp();
            const vessel = newVessel(timestamp);
            await insertVessel(db, vessel);

            const timestamp2 = _.omit(timestamp, "ship.imo");
            const ret = await TimestampsService.saveTimestamp(timestamp2, db);

            expect(ret?.location_locode).toBe(timestamp2.location.port);
            expect(ret?.ship_mmsi).toBe(vessel.mmsi);
            expect(ret?.ship_imo).toBe(vessel.imo);
        });

        test("saveTimestamp - mmsi from vessel", async () => {
            const timestamp = newTimestamp();
            const vessel = newVessel(timestamp);
            await insertVessel(db, vessel);

            const timestamp2 = _.omit(timestamp, "ship.mmsi");
            const ret = await TimestampsService.saveTimestamp(timestamp2, db);

            expect(ret?.location_locode).toBe(timestamp.location.port);
            expect(ret?.ship_mmsi).toBe(vessel.mmsi);
            expect(ret?.ship_imo).toBe(vessel.imo);
        });

        test("saveTimestamp - not saved with missing portcallId when timestamp is not PRED", () => {
            return Promise.all(
                Object.values(EventSource)
                    .filter((source) => source !== EventSource.AWAKE_AI_PRED)
                    .map(async (source) => {
                        const timestamp = _.omit(newTimestamp({ source }), "portcallId");
                        const ret = await TimestampsService.saveTimestamp(timestamp, db);
                        expect(ret).not.toBeDefined();
                    })
            );
        });

        test("saveTimestamp - saved with missing portcallId when timestamp is PRED", async () => {
            const predTimestamp = _.omit(newTimestamp({ source: EventSource.AWAKE_AI_PRED }), "portcallId");
            const ret = await TimestampsService.saveTimestamp(predTimestamp, db);
            expect(ret).toBeDefined();
        });

        test("saveTimestamp - portcall id found for ETB timestamp from VTS A source", async () => {
            const vtsTimestamp = _.omit(
                newTimestamp({
                    eventType: EventType.ETB,
                    eventTime: addHours(Date.now(), 1),
                    locode: "FIRAU",
                    imo: 1234567,
                    mmsi: 7654321,
                    source: EventSource.SCHEDULES_CALCULATED
                }),
                "portcallId"
            );
            const awakeTimestamp = {
                ...vtsTimestamp,
                eventTime: addMinutes(parseISO(vtsTimestamp.eventTime), 30).toISOString(),
                source: EventSource.AWAKE_AI
            };

            const portcallId = 456123;
            await insertPortCall(db, newPortCall(vtsTimestamp, portcallId));
            await insertPortAreaDetails(
                db,
                newPortAreaDetails(vtsTimestamp, {
                    portcallId,
                    eta: addHours(parseISO(vtsTimestamp.eventTime), 1)
                })
            );

            await TimestampsService.saveTimestamp(vtsTimestamp, db);
            await TimestampsService.saveTimestamp(awakeTimestamp, db);

            const timestamps = await findAll(db);
            expect(timestamps).toHaveLength(2);

            const resultApiTimestamp = (
                await TimestampsService.findAllTimestamps(vtsTimestamp.location.port, undefined, undefined)
            )[0];

            assertDefined(resultApiTimestamp);

            expect(parseISO(resultApiTimestamp.eventTime).getTime()).toBeGreaterThan(
                parseISO(vtsTimestamp.eventTime).getTime()
            );
            expect(parseISO(resultApiTimestamp.eventTime).getTime()).toBeLessThan(
                parseISO(awakeTimestamp.eventTime).getTime()
            );
        });

        test("findETAShipsByLocode - same port later in day - just one ETA", async () => {
            const locode = "FIRAU";
            const imo = 123456;
            const eta1 = newTimestamp({
                imo,
                locode,
                eventType: EventType.ETA,
                eventTime: addHours(Date.now(), 1),
                source: EventSource.PORTNET
            });
            const eta2 = newTimestamp({
                imo,
                locode,
                eventType: EventType.ETA,
                eventTime: addHours(Date.now(), 2),
                source: EventSource.PORTNET
            });
            await insertPortCall(db, newPortCall(eta1));
            await insertPortCall(db, newPortCall(eta2));
            await insertPortAreaDetails(db, newPortAreaDetails(eta1));
            await insertPortAreaDetails(db, newPortAreaDetails(eta2));
            await insert(db, [eta1, eta2]);

            const ships = await TimestampsService.findETAShipsByLocode([locode]);

            expect(ships.length).toBe(1);
        });

        test("findETAShipsByLocode - different port later in day - just ETA closest to NOW", async () => {
            const locode1 = "FIRAU";
            const locode2 = "FIHKO";
            const imo = 123456;
            const eta1 = newTimestamp({
                imo,
                locode: locode1,
                eventType: EventType.ETA,
                eventTime: addHours(Date.now(), 1),
                source: EventSource.PORTNET
            });
            const eta2 = newTimestamp({
                imo,
                locode: locode2,
                eventType: EventType.ETA,
                eventTime: addHours(Date.now(), 2),
                source: EventSource.PORTNET
            });
            await insertPortCall(db, newPortCall(eta1));
            await insertPortCall(db, newPortCall(eta2));
            await insertPortAreaDetails(db, newPortAreaDetails(eta1));
            await insertPortAreaDetails(db, newPortAreaDetails(eta2));
            await insert(db, [eta1, eta2]);

            const ship = (await TimestampsService.findETAShipsByLocode([locode1, locode2]))[0];
            assertDefined(ship);

            expect(ship.locode).toBe(locode1);
        });

        test("findETAShipsByLocode - different ship - two ETAs", async () => {
            const locode = "FIRAU";
            const eta1 = newTimestamp({
                imo: 123456,
                locode,
                eventType: EventType.ETA,
                eventTime: addHours(Date.now(), 1),
                source: EventSource.PORTNET
            });
            const eta2 = newTimestamp({
                imo: 654321,
                locode,
                eventType: EventType.ETA,
                eventTime: addHours(Date.now(), 2),
                source: EventSource.PORTNET
            });
            await insertPortCall(db, newPortCall(eta1));
            await insertPortCall(db, newPortCall(eta2));
            await insertPortAreaDetails(db, newPortAreaDetails(eta1));
            await insertPortAreaDetails(db, newPortAreaDetails(eta2));
            await insert(db, [eta1, eta2]);

            const ships = await TimestampsService.findETAShipsByLocode([locode]);

            expect(ships).toHaveLength(2);
        });

        test("deleteOldTimestampsAndPilotages - deletes both old timestamps and pilotages", async () => {
            const olderThanAWeek = subDays(Date.now(), 8);
            const youngerThanAWeek = subDays(Date.now(), 6);
            await insert(db, [
                newTimestamp({
                    eventTime: olderThanAWeek
                }),
                newTimestamp({
                    eventTime: youngerThanAWeek
                })
            ]);
            await insertPilotage(db, 1, "ACTIVE", new Date(), olderThanAWeek);
            await insertPilotage(db, 2, "ACTIVE", new Date(), youngerThanAWeek);

            await new Promise((resolve) => setTimeout(resolve, 1500));

            await TimestampsService.deleteOldTimestampsAndPilotages();

            expect(await findAll(db)).toHaveLength(1);
            expect(await getPilotagesCount(db)).toBe(1);
        });
    })
);
