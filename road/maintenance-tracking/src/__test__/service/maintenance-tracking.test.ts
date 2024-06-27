import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { TyokoneenseurannanKirjaus } from "../../model/models.js";
import {
    cleanMaintenanceTrackingData,
    createMaintenanceTrackingMessageHash,
    saveMaintenanceTrackingObservationData
} from "../../service/maintenance-tracking.js";
import {
    createObservationsDbDatas,
    dbTestBase,
    findAllObservations,
    findAllTrackingIds,
    insertMaintenanceTracking,
    truncate,
    upsertDomain,
    upsertWorkMachine
} from "../db-testutil.js";
import { assertObservationData, getTrackingJsonWith3Observations } from "../testdata.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

describe(
    "maintenance-tracking",
    dbTestBase((db: DTDatabase) => {
        beforeEach(() => truncate(db));

        test("saveMaintenanceTrackingObservationData", async () => {
            const json = getTrackingJsonWith3Observations("1", "1");
            const data = createObservationsDbDatas(json);
            await saveMaintenanceTrackingObservationData(data);

            const fetchedObservations = await findAllObservations(db);
            expect(fetchedObservations.length).toBe(3);
            assertObservationData(data, fetchedObservations);
        });

        test("saveMaintenanceTrackingObservationData should succeed for two different messages", async () => {
            const json1 = getTrackingJsonWith3Observations("1", "456");
            const json2 = getTrackingJsonWith3Observations("2", "654");
            await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json1));
            await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json2));

            const fetchedTrackings = await findAllObservations(db);
            expect(fetchedTrackings.length).toBe(6);
        });

        test("saveMaintenanceTrackingObservationData should ony save once for same content and different message id", async () => {
            const json1 = getTrackingJsonWith3Observations("1", "1");
            const json2 = getTrackingJsonWith3Observations("2", "1");

            await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json1));
            await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json2));

            const fetchedTrackings = await findAllObservations(db);
            expect(fetchedTrackings.length).toBe(3);
        });

        test("saveMaintenanceTrackingObservationData with two equal observations and one different should ony different be saved from second message", async () => {
            const json1 = getTrackingJsonWith3Observations("1", "1");
            const json2 = getTrackingJsonWith3Observations("2", "1").replace(
                "[293358, 6889073]",
                "[293358, 6889074]"
            );

            await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json1));
            await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json2));

            const fetchedTrackings = await findAllObservations(db);
            expect(fetchedTrackings.length).toBe(4);
        });

        test("createMaintenanceTrackingMessageHash should equals for same message but different viestintunniste id", () => {
            const h1 = createMaintenanceTrackingMessageHash(getTrackingJsonWith3Observations("1", "1"));
            const h2 = createMaintenanceTrackingMessageHash(getTrackingJsonWith3Observations("2", "1"));
            // Assert has is same for same json with different viestitunniste
            expect(h1).toBe(h2);
        });

        test("createMaintenanceTrackingMessageHash should differ for different message", () => {
            const h1 = createMaintenanceTrackingMessageHash(getTrackingJsonWith3Observations("1", "123"));
            const h2 = createMaintenanceTrackingMessageHash(getTrackingJsonWith3Observations("1", "321"));
            // Assert has is not same for same json with different data content excluding viestitunniste
            expect(h1).not.toBe(h2);
        });

        test("createObservationHash should equals for same message", () => {
            const tracking = JSON.parse(
                getTrackingJsonWith3Observations("1", "1")
            ) as TyokoneenseurannanKirjaus;
            expect(tracking.havainnot.length).toBe(3);
            const observation = tracking.havainnot[0]!.havainto;
            const h1 = createMaintenanceTrackingMessageHash(JSON.stringify(observation));
            const h2 = createMaintenanceTrackingMessageHash(JSON.stringify(observation));
            // Assert has is same for same json with different viestitunniste
            expect(h1).toBe(h2);
        });

        test("createObservationHash should differ for different message", () => {
            const tracking = JSON.parse(
                getTrackingJsonWith3Observations("1", "1")
            ) as TyokoneenseurannanKirjaus;
            expect(tracking.havainnot.length).toBe(3);
            const observation1 = tracking.havainnot[0]!.havainto;
            const observation2 = tracking.havainnot[1]!.havainto;
            const h1 = createMaintenanceTrackingMessageHash(JSON.stringify(observation1));
            const h2 = createMaintenanceTrackingMessageHash(JSON.stringify(observation2));
            // Assert has is same for same json with different viestitunniste
            expect(h1).not.toBe(h2);
        });

        test("getTrackingJsonWith3Observations works with viestintunniste and tyokone id", () => {
            expect(getTrackingJsonWith3Observations("1", "1")).toBe(
                getTrackingJsonWith3Observations("1", "1")
            );
            expect(getTrackingJsonWith3Observations("1", "1")).not.toBe(
                getTrackingJsonWith3Observations("2", "1")
            );
            expect(getTrackingJsonWith3Observations("1", "123")).toBe(
                getTrackingJsonWith3Observations("1", "123")
            );
            expect(getTrackingJsonWith3Observations("1", "123")).not.toBe(
                getTrackingJsonWith3Observations("1", "321")
            );
        });

        test("cleanMaintenanceTrackingData", async () => {
            const now = new Date();

            const wMId = await upsertWorkMachine(db);
            await upsertDomain(db, "state-roads");

            const id1 = await insertMaintenanceTracking(db, wMId, minusMinutes(now, 60 * 3 + 1)); // endTime over 3h -> delete
            const id2 = await insertMaintenanceTracking(db, wMId, minusMinutes(now, 60 * 2 + 1)); // endTime over 2h -> delete
            const id3 = await insertMaintenanceTracking(db, wMId, minusMinutes(now, 70)); // endTime over 1h -> delete
            const id4 = await insertMaintenanceTracking(db, wMId, minusMinutes(now, 65), id3); // endTime over 1h -> delete
            const id5 = await insertMaintenanceTracking(db, wMId, minusMinutes(now, 61), id4); // endTime over 1h, but ref from id4 -> no delete
            const id6 = await insertMaintenanceTracking(db, wMId, minusMinutes(now, 59), id5); // endTime inside 1h -> no delete
            const id7 = await insertMaintenanceTracking(db, wMId, minusMinutes(now, 55), id6); // endTime inside 1h -> no delete

            const idsBeforeCleanup = await findAllTrackingIds(db);
            logger.debug(`idsBeforeCleanup: ${JSON.stringify(idsBeforeCleanup)}`);
            expect(idsBeforeCleanup.length).toEqual(7);
            expect(idsBeforeCleanup.includes(id1)).toBe(true);
            expect(idsBeforeCleanup.includes(id2)).toBe(true);
            expect(idsBeforeCleanup.includes(id3)).toBe(true);
            expect(idsBeforeCleanup.includes(id4)).toBe(true);
            expect(idsBeforeCleanup.includes(id5)).toBe(true);
            expect(idsBeforeCleanup.includes(id6)).toBe(true);
            expect(idsBeforeCleanup.includes(id7)).toBe(true);

            await cleanMaintenanceTrackingData(1);

            const idsAfterCleanup = await findAllTrackingIds(db);
            logger.debug(`idsAfterCleanup: ${JSON.stringify(idsAfterCleanup)}`);
            expect(idsAfterCleanup.length).toEqual(3);

            expect(idsAfterCleanup.includes(id5)).toBe(true);
            expect(idsAfterCleanup.includes(id6)).toBe(true);
            expect(idsAfterCleanup.includes(id7)).toBe(true);
        });

        test("cleanMaintenanceTrackingData all data is old", async () => {
            const now = new Date();

            const wMId = await upsertWorkMachine(db);
            await upsertDomain(db, "state-roads");

            await insertMaintenanceTracking(db, wMId, minusMinutes(now, 60 * 3 + 1)); // endTime over 3h -> delete
            await insertMaintenanceTracking(db, wMId, minusMinutes(now, 60 * 2 + 1)); // endTime over 2h -> delete
            await insertMaintenanceTracking(db, wMId, minusMinutes(now, 70)); // endTime over 1h -> delete
            const id4 = await insertMaintenanceTracking(db, wMId, minusMinutes(now, 65)); // endTime over 1h -> Should delete, but needs to leave one tracking/domain -> no delete

            const idsBeforeCleanup = await findAllTrackingIds(db);
            logger.debug(`idsBeforeCleanup: ${JSON.stringify(idsBeforeCleanup)}`);
            expect(idsBeforeCleanup.length).toEqual(4);

            await cleanMaintenanceTrackingData(1);

            const idsAfterCleanup = await findAllTrackingIds(db);
            logger.debug(`idsAfterCleanup: ${JSON.stringify(idsAfterCleanup)}`);
            expect(idsAfterCleanup.length).toEqual(1);

            // Latest tracking should exist
            expect(idsAfterCleanup.includes(id4)).toBe(true);
        });
    })
);

function minusMinutes(time: Date, minutes: number): Date {
    return new Date(time.getTime() - 1000 * 60 * minutes);
}
