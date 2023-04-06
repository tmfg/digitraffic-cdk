import { validateTimestamp } from "../../lib/model/timestamp";
import { newTimestamp } from "../testdata";

describe("timestamp model", () => {
    test("validateTimestamp - ok", () => {
        expect(validateTimestamp(newTimestamp())).toBeDefined();
    });

    test("validateTimestamp - missing eventType", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).eventType;

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });

    test("validateTimestamp - missing eventTime", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).eventTime;

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });

    test("validateTimestamp - invalid eventTime", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (timestamp as any).eventTime = "123456-qwerty";

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });

    test("validateTimestamp - invalid eventTimeConfidenceLowerDiff", () => {
        const timestamp = newTimestamp({
            eventTimeConfidenceUpperDiff: 1000
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (timestamp as any).eventTimeConfidenceLowerDiff = "-1000a";

        expect(validateTimestamp(timestamp)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
        expect(validateTimestamp(timestamp)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
    });

    test("validateTimestamp - invalid eventTimeConfidenceUpperDiff", () => {
        const timestamp = newTimestamp({
            eventTimeConfidenceLowerDiff: -1000
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (timestamp as any).eventTimeConfidenceUpperDiff = "1000a";

        expect(validateTimestamp(timestamp)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
        expect(validateTimestamp(timestamp)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
    });

    test("validateTimestamp - invalid confidence interval range", () => {
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

        expect(validateTimestamp(timestamp)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
        expect(validateTimestamp(timestamp)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
        expect(validateTimestamp(timestamp2)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
        expect(validateTimestamp(timestamp2)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
        expect(validateTimestamp(timestamp3)).not.toHaveProperty("eventTimeConfidenceLowerDiff");
        expect(validateTimestamp(timestamp3)).not.toHaveProperty("eventTimeConfidenceUpperDiff");
    });

    test("validateTimestamp - missing recordTime", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).recordTime;

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });

    test("validateTimestamp - invalid recordTime", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (timestamp as any).recordTime = "123456-qwerty";

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });

    test("validateTimestamp - missing source", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).source;

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });

    test("validateTimestamp - missing ship", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).ship;

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });

    test("validateTimestamp - missing mmsi & imo", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp.ship as any).mmsi;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp.ship as any).imo;

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });

    test("validateTimestamp - missing location", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).location;

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });

    test("validateTimestamp - missing port", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp.location as any).port;

        expect(validateTimestamp(timestamp)).toEqual(undefined);
    });
});
