import { dbTestBase, insertPilotage, insertPortCall } from "../db-testutil.js";
import { deletePilotages, findPortCallId, getTimestamps } from "../../dao/pilotages.js";
import type { Pilotage } from "../../model/pilotage.js";
import type { Location } from "../../model/timestamp.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { newPortCall, newTimestamp } from "../testdata.js";
import { subHours } from "date-fns";

describe(
    "db-pilotages-public",
    dbTestBase((db: DTDatabase) => {
        function createPilotage(mmsi: number = 123, start: string = "ABC", end: string = "DEF"): Pilotage {
            return {
                id: 1,
                state: "TEST",
                vessel: {
                    name: "test",
                    mmsi
                },
                route: {
                    start: {
                        code: start
                    },
                    end: {
                        code: end
                    }
                },
                vesselEta: "",
                endTime: "",
                scheduleSource: "test",
                scheduleUpdated: ""
            };
        }

        function createLocation(port: string = "ABC", from: string = "DEF"): Location {
            return {
                port,
                from
            };
        }

        test("findPortCallId - empty", async () => {
            const pilotage = createPilotage();
            const location = createLocation();
            expect(await findPortCallId(db, pilotage, location)).toBeUndefined();
        });

        test("findPortCallId - found when portcall not older than 36 hours", async () => {
            const portcallId = 1234567;
            const mmsi = 123;
            const locode = "FIABC";
            const portcall = newPortCall(
                newTimestamp({ mmsi, locode }),
                portcallId,
                subHours(Date.now(), 35)
            );
            await insertPortCall(db, portcall);

            const pilotage = createPilotage(mmsi, locode);
            const location = createLocation(locode);

            const foundPortcallId = await findPortCallId(db, pilotage, location);
            expect(foundPortcallId).toEqual(portcallId);
        });

        test("findPortCallId - not found when portcall older than 36 hours", async () => {
            const portcallId = 1234567;
            const mmsi = 123;
            const locode = "FIABC";
            const portcall = newPortCall(
                newTimestamp({ mmsi, locode }),
                portcallId,
                subHours(Date.now(), 37)
            );
            await insertPortCall(db, portcall);

            const pilotage = createPilotage(mmsi, locode);
            const location = createLocation(locode);

            const foundPortcallId = await findPortCallId(db, pilotage, location);
            expect(foundPortcallId).toBeUndefined();
        });

        test("findPortCallId - return portcallId relating to outgoing pilotage if portcallId found for both start and end location", async () => {
            const portcallId1 = 1234567;
            const portcallId2 = 7654321;
            const mmsi = 123;
            const locodeFrom = "FIABC";
            const locodeTo = "FIDEF";
            const portcall1 = newPortCall(newTimestamp({ mmsi, locode: locodeFrom }), portcallId1);
            const portcall2 = newPortCall(newTimestamp({ mmsi, locode: locodeTo }), portcallId2);
            await insertPortCall(db, portcall1);
            await insertPortCall(db, portcall2);

            const pilotage = createPilotage(mmsi, locodeFrom, locodeTo);
            const location = createLocation(locodeTo, locodeFrom);

            const foundPortcallId = await findPortCallId(db, pilotage, location);
            expect(foundPortcallId).toEqual(portcallId1);
        });

        test("getTimestamps - empty", async () => {
            const timestampMap = await getTimestamps(db);

            expect(timestampMap.size).toEqual(0);
        });

        test("getTimestamps - one", async () => {
            const now = new Date();
            await insertPilotage(db, 1, "ACTIVE", now);

            const timestampMap = await getTimestamps(db);

            expect(timestampMap.size).toEqual(1);
            expect(timestampMap.get(1)).toStrictEqual(now);

            // update it to finished, so it should not show up
            await insertPilotage(db, 1, "FINISHED", now);

            const timestampMap2 = await getTimestamps(db);

            expect(timestampMap2.size).toEqual(0);
        });

        test("deletePilotages - none", async () => {
            const removed = await deletePilotages(db, []);
            expect(removed).toHaveLength(0);
        });

        test("deletePilotages - one", async () => {
            const now = new Date();
            await insertPilotage(db, 1, "ACTIVE", now);
            await insertPilotage(db, 2, "ACTIVE", now);

            const timestampMap = await getTimestamps(db);
            expect(timestampMap.size).toEqual(2);

            // delete one
            const deleted = await deletePilotages(db, [1]);
            const timestampMap2 = await getTimestamps(db);

            expect(deleted).toHaveLength(1);
            expect(timestampMap2.size).toEqual(1);
            expect(timestampMap2.get(2)).toStrictEqual(now);
        });
    })
);
