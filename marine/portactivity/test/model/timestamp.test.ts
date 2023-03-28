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

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - missing eventTime", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).eventTime;

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - invalid eventTime", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (timestamp as any).eventTime = "123456-qwerty";

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - invalid eventTimeConfidenceLowerDiff", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (timestamp as any).eventTimeConfidenceLowerDiff = "PT1Hasdf";

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - invalid eventTimeConfidenceUpperDiff", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (timestamp as any).eventTimeConfidenceUpperDiff = "PT1Hasdf";

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - missing recordTime", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).recordTime;

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - invalid recordTime", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (timestamp as any).recordTime = "123456-qwerty";

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - missing source", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).source;

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - missing ship", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).ship;

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - missing mmsi & imo", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp.ship as any).mmsi;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp.ship as any).imo;

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - missing location", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp as any).location;

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });

    test("validateTimestamp - missing port", () => {
        const timestamp = newTimestamp();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (timestamp.location as any).port;

        expect(validateTimestamp(timestamp)).toBeUndefined();
    });
});
