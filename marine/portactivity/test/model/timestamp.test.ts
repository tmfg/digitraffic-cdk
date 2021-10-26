import {validateTimestamp} from "../../lib/model/timestamp";
import {newTimestamp} from "../testdata";

describe('timestamp model', () => {

    test('validateTimestamp - ok', () => {
        expect(validateTimestamp(newTimestamp())).toBe(true);
    });

    test('validateTimestamp - missing eventType', () => {
        const timestamp = newTimestamp();

        delete (timestamp as any).eventType;

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - missing eventTime', () => {
        const timestamp = newTimestamp();

        delete (timestamp as any).eventTime;

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - invalid eventTime', () => {
        const timestamp = newTimestamp();

        (timestamp as any).eventTime = '123456-qwerty'

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - invalid eventTimeConfidenceLower', () => {
        const timestamp = newTimestamp();

        (timestamp as any).eventTimeConfidenceLower = 'PT1Hasdf'

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - invalid eventTimeConfidenceUpper', () => {
        const timestamp = newTimestamp();

        (timestamp as any).eventTimeConfidenceUpper = 'PT1Hasdf'

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - invalid eventTimeConfidenceUpper', () => {
        const timestamp = newTimestamp();

        (timestamp as any).eventTimeConfidenceUpper = 'PT1Hasdf'

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - missing recordTime', () => {
        const timestamp = newTimestamp();

        delete (timestamp as any).recordTime;

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - invalid recordTime', () => {
        const timestamp = newTimestamp();

        (timestamp as any).recordTime = '123456-qwerty'

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - missing source', () => {
        const timestamp = newTimestamp();

        delete (timestamp as any).source;

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - missing ship', () => {
        const timestamp = newTimestamp();

        delete (timestamp as any).ship;

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - missing mmsi & imo', () => {
        const timestamp = newTimestamp();

        delete (timestamp.ship as any).mmsi;
        delete (timestamp.ship as any).imo;
        console.log(timestamp)

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - missing location', () => {
        const timestamp = newTimestamp();

        delete (timestamp as any).location;

        expect(validateTimestamp(timestamp)).toBe(false);
    });

    test('validateTimestamp - missing port', () => {
        const timestamp = newTimestamp();

        delete (timestamp.location as any).port;

        expect(validateTimestamp(timestamp)).toBe(false);
    });

});
