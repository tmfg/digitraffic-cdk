import {
    dbTestBase,
    findAll,
    getPilotagesCount,
    insert,
    insertPilotage,
    insertPortAreaDetails,
    insertPortCall,
    insertVessel
} from "../db-testutil";
import { newPortAreaDetails, newPortCall, newTimestamp, newVessel } from "../testdata";
import moment from "moment-timezone";
import * as TimestampsService from "../../lib/service/timestamps";
import { ApiTimestamp, EventType } from "../../lib/model/timestamp";
import { EventSource } from "../../lib/model/eventsource";
import * as R from "ramda";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { subDays } from "date-fns";

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
            expect(timestamps.length).toBe(1);
            expect(timestamps[0]).toMatchObject(timestamp);
        });

        test("findAllTimestamps - mmsi", async () => {
            const timestamp = newTimestamp();
            await insert(db, [timestamp]);

            const timestamps = await TimestampsService.findAllTimestamps(
                undefined,
                timestamp.ship.mmsi,
                undefined
            );

            expect(timestamps.length).toBe(1);
            expect(timestamps[0]).toMatchObject(timestamp);
        });

        test("findAllTimestamps - imo", async () => {
            const timestamp = newTimestamp();
            await insert(db, [timestamp]);

            const timestamps = await TimestampsService.findAllTimestamps(
                undefined,
                undefined,
                timestamp.ship.imo
            );

            expect(timestamps.length).toBe(1);
            expect(timestamps[0]).toMatchObject(timestamp);
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
                eventTime: moment(olderTimestamp.eventTime).add(1, "hours").toISOString()
            };

            await TimestampsService.saveTimestamp(olderTimestamp, db);
            const ret = await TimestampsService.saveTimestamp(newerTimestamp, db);

            expect(ret?.locodeChanged).toBe(false);
            expect((await findAll(db)).length).toBe(2);
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

        test("saveTimestamp - no IMO not saved", async () => {
            const timestamp = R.dissocPath<ApiTimestamp>(["ship", "imo"], newTimestamp());

            const ret = await TimestampsService.saveTimestamp(timestamp, db);

            expect(ret).toBeUndefined();
        });

        test("saveTimestamp - no MMSI not saved", async () => {
            const timestamp = R.dissocPath<ApiTimestamp>(["ship", "mmsi"], newTimestamp());

            const ret = await TimestampsService.saveTimestamp(timestamp, db);

            expect(ret).toBeUndefined();
        });

        test("saveTimestamp - imo from vessel", async () => {
            const timestamp = newTimestamp();
            const vessel = newVessel(timestamp);
            await insertVessel(db, vessel);

            const timestamp2 = R.dissocPath<ApiTimestamp>(["ship", "imo"], timestamp);
            const ret = await TimestampsService.saveTimestamp(timestamp2, db);

            expect(ret?.location_locode).toBe(timestamp2.location.port);
            expect(ret?.ship_mmsi).toBe(vessel.mmsi);
            expect(ret?.ship_imo).toBe(vessel.imo);
        });

        test("saveTimestamp - mmsi from vessel", async () => {
            const timestamp = newTimestamp();
            const vessel = newVessel(timestamp);
            await insertVessel(db, vessel);

            const timestamp2 = R.dissocPath<ApiTimestamp>(["ship", "mmsi"], timestamp);
            const ret = await TimestampsService.saveTimestamp(timestamp2, db);

            expect(ret?.location_locode).toBe(timestamp.location.port);
            expect(ret?.ship_mmsi).toBe(vessel.mmsi);
            expect(ret?.ship_imo).toBe(vessel.imo);
        });

        test("findETAShipsByLocode - same port later in day - just one ETA", async () => {
            const locode = "FILOL";
            const imo = 123456;
            const eta1 = newTimestamp({
                imo,
                locode,
                eventType: EventType.ETA,
                eventTime: moment().add(1, "hours").toDate(),
                source: EventSource.PORTNET
            });
            const eta2 = newTimestamp({
                imo,
                locode,
                eventType: EventType.ETA,
                eventTime: moment().add(2, "hours").toDate(),
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
            const locode1 = "FILOL";
            const locode2 = "FIKEK";
            const imo = 123456;
            const eta1 = newTimestamp({
                imo,
                locode: locode1,
                eventType: EventType.ETA,
                eventTime: moment().add(1, "hours").toDate(),
                source: EventSource.PORTNET
            });
            const eta2 = newTimestamp({
                imo,
                locode: locode2,
                eventType: EventType.ETA,
                eventTime: moment().add(2, "hours").toDate(),
                source: EventSource.PORTNET
            });
            await insertPortCall(db, newPortCall(eta1));
            await insertPortCall(db, newPortCall(eta2));
            await insertPortAreaDetails(db, newPortAreaDetails(eta1));
            await insertPortAreaDetails(db, newPortAreaDetails(eta2));
            await insert(db, [eta1, eta2]);

            const ships = await TimestampsService.findETAShipsByLocode([locode1, locode2]);

            expect(ships.length).toBe(1);
            expect(ships[0].locode).toBe(locode1);
        });

        test("findETAShipsByLocode - different ship - two ETAs", async () => {
            const locode = "FILOL";
            const eta1 = newTimestamp({
                imo: 123456,
                locode,
                eventType: EventType.ETA,
                eventTime: moment().add(1, "hours").toDate(),
                source: EventSource.PORTNET
            });
            const eta2 = newTimestamp({
                imo: 654321,
                locode,
                eventType: EventType.ETA,
                eventTime: moment().add(2, "hours").toDate(),
                source: EventSource.PORTNET
            });
            await insertPortCall(db, newPortCall(eta1));
            await insertPortCall(db, newPortCall(eta2));
            await insertPortAreaDetails(db, newPortAreaDetails(eta1));
            await insertPortAreaDetails(db, newPortAreaDetails(eta2));
            await insert(db, [eta1, eta2]);

            const ships = await TimestampsService.findETAShipsByLocode([locode]);

            expect(ships.length).toBe(2);
        });

        test("deleteOldTimestampsAndPilotages - deletes both old timestamps and pilotages", async () => {
            const olderThanAWeek = subDays(Date.now(), 7);
            await insert(db, [
                newTimestamp({
                    eventTime: olderThanAWeek
                })
            ]);
            await insertPilotage(db, 1, "ACTIVE", new Date(), olderThanAWeek);

            await new Promise((resolve) => setTimeout(resolve, 1500));

            await TimestampsService.deleteOldTimestampsAndPilotages();

            expect((await findAll(db)).length).toBe(0);
            expect(await getPilotagesCount(db)).toBe(0);
        });
    })
);
