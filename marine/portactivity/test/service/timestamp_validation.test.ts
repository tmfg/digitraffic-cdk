import {
    SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS,
    shipIsStationary,
    validateTimestamp
} from "../../lib/service/timestamp_validation";
import { newTimestamp } from "../testdata";
import { dbTestBase, insertVesselLocation } from "../db-testutil";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { EventSource } from "../../lib/model/eventsource";
import * as R from "ramda";
import { ApiTimestamp } from "../../lib/model/timestamp";

describe(
    "timestamp model",
    dbTestBase((db: DTDatabase) => {
        test("validateTimestamp - ok", async () => {
            expect(await validateTimestamp(newTimestamp(), db)).toBeDefined();
        });

        test("validateTimestamp - missing eventType", async () => {
            const timestamp = R.dissocPath<ApiTimestamp>(["eventType"], newTimestamp());
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing eventTime", async () => {
            const timestamp = R.dissocPath<ApiTimestamp>(["eventTime"], newTimestamp());
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - invalid eventTime", async () => {
            const timestamp = R.assoc("eventTime", "123456-qwerty", newTimestamp()) as Partial<ApiTimestamp>;
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - invalid eventTimeConfidenceLowerDiff", async () => {
            const timestamp = R.assoc(
                "eventTimeConfidenceLowerDiff",
                "-1000a",
                newTimestamp({
                    eventTimeConfidenceUpperDiff: 1000
                })
            ) as unknown as Partial<ApiTimestamp>;

            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
        });

        test("validateTimestamp - invalid eventTimeConfidenceUpperDiff", async () => {
            const timestamp = R.assoc(
                "eventTimeConfidenceUpperDiff",
                "-1000a",
                newTimestamp({
                    eventTimeConfidenceLowerDiff: 1000
                })
            ) as unknown as Partial<ApiTimestamp>;

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
            const timestamp = R.dissocPath<ApiTimestamp>(["recordTime"], newTimestamp());
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - invalid recordTime", async () => {
            const timestamp = R.assoc("recordTime", "123456-qwerty", newTimestamp()) as Partial<ApiTimestamp>;
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing source", async () => {
            const timestamp = R.dissocPath<ApiTimestamp>(["source"], newTimestamp());
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing ship", async () => {
            const timestamp = R.dissocPath<ApiTimestamp>(["ship"], newTimestamp());
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing mmsi & imo", async () => {
            const timestamp = R.dissocPath<ApiTimestamp>(
                ["ship", "mmsi"],
                R.dissocPath<ApiTimestamp>(["ship", "imo"], newTimestamp())
            );
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing location", async () => {
            const timestamp = R.dissocPath<ApiTimestamp>(["location"], newTimestamp());
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing port", async () => {
            const timestamp = R.dissocPath<ApiTimestamp>(["location", "port"], newTimestamp());
            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - vts prediction and stationary ship", async () => {
            const mmsi = 123;
            const timestamp = newTimestamp({ mmsi, source: EventSource.SCHEDULES_CALCULATED });

            await insertVesselLocation(db, mmsi, SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS - 0.1);

            expect(await shipIsStationary(db, timestamp)).toEqual(true);
            //expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - vts prediction and moving ship", async () => {
            const mmsi = 123;
            const timestamp = newTimestamp({ mmsi, source: EventSource.SCHEDULES_CALCULATED });

            await insertVesselLocation(db, mmsi, SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS + 0.1);

            expect(await shipIsStationary(db, timestamp)).toEqual(false);
            //const validatedTimestamp = await validateTimestamp(timestamp, db);
            //expect(validatedTimestamp?.ship.mmsi).toEqual(mmsi);
        });
    })
);
