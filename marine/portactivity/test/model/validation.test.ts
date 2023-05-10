import {
    SHIP_SPEED_STATIONARY_THRESHOLD_KNOT_TENTHS,
    shipIsStationary,
    validateTimestamp
} from "../../lib/model/validation";
import { newTimestamp } from "../testdata";
import { dbTestBase, insertVesselLocation } from "../db-testutil";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { EventSource } from "../../lib/model/eventsource";

describe(
    "timestamp model",
    dbTestBase((db: DTDatabase) => {
        test("validateTimestamp - ok", async () => {
            expect(await validateTimestamp(newTimestamp(), db)).toBeDefined();
        });

        test("validateTimestamp - missing eventType", async () => {
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            delete (timestamp as any).eventType;

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing eventTime", async () => {
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            delete (timestamp as any).eventTime;

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - invalid eventTime", async () => {
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            (timestamp as any).eventTime = "123456-qwerty";

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - invalid eventTimeConfidenceLowerDiff", async () => {
            const timestamp = newTimestamp({
                eventTimeConfidenceUpperDiff: 1000
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            (timestamp as any).eventTimeConfidenceLowerDiff = "-1000a";

            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
            expect(await validateTimestamp(timestamp, db)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
        });

        test("validateTimestamp - invalid eventTimeConfidenceUpperDiff", async () => {
            const timestamp = newTimestamp({
                eventTimeConfidenceLowerDiff: -1000
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            (timestamp as any).eventTimeConfidenceUpperDiff = "1000a";

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
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            delete (timestamp as any).recordTime;

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - invalid recordTime", async () => {
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            (timestamp as any).recordTime = "123456-qwerty";

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing source", async () => {
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            delete (timestamp as any).source;

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing ship", async () => {
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            delete (timestamp as any).ship;

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing mmsi & imo", async () => {
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            delete (timestamp.ship as any).mmsi;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            delete (timestamp.ship as any).imo;

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing location", async () => {
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            delete (timestamp as any).location;

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - missing port", async () => {
            const timestamp = newTimestamp();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            delete (timestamp.location as any).port;

            expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - vts prediction and stationary ship", async () => {
            const mmsi = 123;
            const timestamp = newTimestamp({ mmsi, source: EventSource.SCHEDULES_CALCULATED });

            await insertVesselLocation(db, mmsi, SHIP_SPEED_STATIONARY_THRESHOLD_KNOT_TENTHS - 0.1);

            expect(await shipIsStationary(db, timestamp)).toEqual(true);
            //expect(await validateTimestamp(timestamp, db)).toEqual(undefined);
        });

        test("validateTimestamp - vts prediction and moving ship", async () => {
            const mmsi = 123;
            const timestamp = newTimestamp({ mmsi, source: EventSource.SCHEDULES_CALCULATED });

            await insertVesselLocation(db, mmsi, SHIP_SPEED_STATIONARY_THRESHOLD_KNOT_TENTHS + 0.1);

            expect(await shipIsStationary(db, timestamp)).toEqual(false);
            //const validatedTimestamp = await validateTimestamp(timestamp, db);
            //expect(validatedTimestamp?.ship.mmsi).toEqual(mmsi);
        });
    })
);
