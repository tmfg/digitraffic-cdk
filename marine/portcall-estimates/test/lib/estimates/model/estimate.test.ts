import {validateEstimate} from "../../../../lib/estimates/model/estimate";
import {newEstimate} from "../../testdata";

describe('estimate model', () => {

    test('validateEstimate - ok', () => {
        expect(validateEstimate(newEstimate())).toBe(true);
    });

    test('validateEstimate - missing eventType', () => {
        const estimate = newEstimate();

        delete (estimate as any).eventType;

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - missing eventTime', () => {
        const estimate = newEstimate();

        delete (estimate as any).eventTime;

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - invalid eventTime', () => {
        const estimate = newEstimate();

        (estimate as any).eventTime = '123456-qwerty'

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - invalid eventTimeConfidenceLower', () => {
        const estimate = newEstimate();

        (estimate as any).eventTimeConfidenceLower = 'PT1Hasdf'

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - invalid eventTimeConfidenceUpper', () => {
        const estimate = newEstimate();

        (estimate as any).eventTimeConfidenceUpper = 'PT1Hasdf'

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - invalid eventTimeConfidenceUpper', () => {
        const estimate = newEstimate();

        (estimate as any).eventTimeConfidenceUpper = 'PT1Hasdf'

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - missing recordTime', () => {
        const estimate = newEstimate();

        delete (estimate as any).recordTime;

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - invalid recordTime', () => {
        const estimate = newEstimate();

        (estimate as any).recordTime = '123456-qwerty'

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - missing source', () => {
        const estimate = newEstimate();

        delete (estimate as any).source;

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - missing ship', () => {
        const estimate = newEstimate();

        delete (estimate as any).ship;

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - missing mmsi & imo', () => {
        const estimate = newEstimate();

        delete (estimate.ship as any).mmsi;
        delete (estimate.ship as any).imo;
        console.log(estimate)

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - missing location', () => {
        const estimate = newEstimate();

        delete (estimate as any).location;

        expect(validateEstimate(estimate)).toBe(false);
    });

    test('validateEstimate - missing port', () => {
        const estimate = newEstimate();

        delete (estimate.location as any).port;
        console.log(estimate)

        expect(validateEstimate(estimate)).toBe(false);
    });

});
