import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import _ from "lodash";
import { NavStatus } from "../../model/ais-status.js";
import { EventSource } from "../../model/eventsource.js";
import { EventType } from "../../model/timestamp.js";
import {
    SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS,
    validateTimestamp
} from "../../service/timestamp-validation.js";
import { dbTestBase, insertVesselLocation } from "../db-testutil.js";
import { newTimestamp } from "../testdata.js";

describe(
    "timestamp model",
    dbTestBase((db: DTDatabase) => {
        test("validateTimestamp - ok", async () => {
            expect(await validateTimestamp(newTimestamp(), db)).toBeDefined();
        });

        test("validateTimestamp - missing eventType", async () => {
            const timestamp = _.omit(newTimestamp(), "eventType");
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing eventTime", async () => {
            const timestamp = _.omit(newTimestamp(), "eventTime");
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - invalid eventTime", async () => {
            const timestamp = _.set(newTimestamp(), "eventTime", "123456-qwerty");
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - invalid eventTimeConfidenceLowerDiff", async () => {
            const timestamp = _.set(
                newTimestamp({ eventTimeConfidenceUpperDiff: 1000 }),
                "eventTimeConfidenceLowerDiff",
                "-1000a"
            );

            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
        });

        test("validateTimestamp - invalid eventTimeConfidenceUpperDiff", async () => {
            const timestamp = _.set(
                newTimestamp({ eventTimeConfidenceLowerDiff: 1000 }),
                "eventTimeConfidenceUpperDiff",
                "-1000a"
            );

            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
        });

        test("validateTimestamp - invalid confidence interval range", async () => {
            const timestamp = newTimestamp({
                eventTimeConfidenceLowerDiff: 1000,
                eventTimeConfidenceUpperDiff: -1000
            });

            const timestamp2 = newTimestamp({
                eventTimeConfidenceLowerDiff: 1000,
                eventTimeConfidenceUpperDiff: 2000
            });

            const timestamp3 = newTimestamp({
                eventTimeConfidenceLowerDiff: -2000,
                eventTimeConfidenceUpperDiff: -1000
            });

            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
            expect(await validateTimestamp(timestamp2, db)).not.toHaveProperty(
                "eventTimeConfidenceLowerDiff"
            );
            expect(await validateTimestamp(timestamp2, db)).not.toHaveProperty(
                "eventTimeConfidenceUpperDiff"
            );
            expect(await validateTimestamp(timestamp3, db)).not.toHaveProperty(
                "eventTimeConfidenceLowerDiff"
            );
            expect(await validateTimestamp(timestamp3, db)).not.toHaveProperty(
                "eventTimeConfidenceUpperDiff"
            );
        });

        test("validateTimestamp - missing recordTime", async () => {
            const timestamp = _.omit(newTimestamp(), "recordTime");
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - invalid recordTime", async () => {
            const timestamp = _.set(newTimestamp(), "recordTime", "123456-qwerty");
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing source", async () => {
            const timestamp = _.omit(newTimestamp(), "source");
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing ship", async () => {
            const timestamp = _.omit(newTimestamp(), "ship");
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing mmsi & imo", async () => {
            const timestamp = _.omit(newTimestamp(), ["ship.imo", "ship.mmsi"]);
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing location", async () => {
            const timestamp = _.omit(newTimestamp(), "location");
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing port", async () => {
            const timestamp = _.omit(newTimestamp(), "location", "port");
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - vts prediction and ship speed under threshold", async () => {
            const mmsi = 123;
            const etaTimestamp = newTimestamp({
                eventType: EventType.ETA,
                mmsi,
                source: EventSource.SCHEDULES_CALCULATED
            });
            const etbTimestamp = newTimestamp({
                eventType: EventType.ETB,
                mmsi,
                source: EventSource.SCHEDULES_CALCULATED
            });

            await insertVesselLocation(
                db,
                mmsi,
                SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS - 0.1,
                NavStatus.UNDER_WAY_USING_ENGINE
            );

            const validatedEtaTimestamp = await validateTimestamp(etaTimestamp, db);
            expect(validatedEtaTimestamp).toEqual(undefined);

            const validatedEtbTimestamp = await validateTimestamp(etbTimestamp, db);
            expect(validatedEtbTimestamp).toEqual(undefined);
        });

        test("validateTimestamp - vts prediction and moving ship with valid nav status", async () => {
            const mmsi = 123;
            const etaTimestamp = newTimestamp({
                eventType: EventType.ETA,
                mmsi,
                source: EventSource.SCHEDULES_CALCULATED
            });
            const etbTimestamp = newTimestamp({
                eventType: EventType.ETB,
                mmsi,
                source: EventSource.SCHEDULES_CALCULATED
            });

            await insertVesselLocation(
                db,
                mmsi,
                SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS + 0.1,
                NavStatus.UNDER_WAY_USING_ENGINE
            );

            const validatedEtaTimestamp = await validateTimestamp(etaTimestamp, db);
            expect(validatedEtaTimestamp?.ship.mmsi).toEqual(mmsi);

            const validatedEtbTimestamp = await validateTimestamp(etbTimestamp, db);
            expect(validatedEtbTimestamp?.ship.mmsi).toEqual(mmsi);
        });

        test("validateTimestamp - vts prediction and invalid navigational status", async () => {
            const mmsi = 123;
            const etaTimestamp = newTimestamp({
                eventType: EventType.ETA,
                mmsi,
                source: EventSource.SCHEDULES_CALCULATED
            });
            const etbTimestamp = newTimestamp({
                eventType: EventType.ETB,
                mmsi,
                source: EventSource.SCHEDULES_CALCULATED
            });

            await insertVesselLocation(
                db,
                mmsi,
                SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS + 0.1,
                NavStatus.AT_ANCHOR
            );

            const validatedEtaTimestamp = await validateTimestamp(etaTimestamp, db);
            expect(validatedEtaTimestamp).toEqual(undefined);

            const validatedEtbTimestamp = await validateTimestamp(etbTimestamp, db);
            expect(validatedEtbTimestamp).toEqual(undefined);
        });
    })
);
