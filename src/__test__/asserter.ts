/**
 * A simple asserter-class for writing canaries without dependency to testing-libraries.
 */

type AssertedValue = string | number;

export abstract class Asserter {
    static assertEquals(value: AssertedValue, expected: AssertedValue): void {
        if (value !== expected) {
            throw new Error(
                `Given value ${value} was not expected ${expected}`,
            );
        }
    }

    static assertTrue(value: boolean): void {
        if (!value) {
            throw new Error(`Given value was not true`);
        }
    }

    static assertLength<T>(data: T[] | undefined, expected: number): void {
        if (!data) {
            throw new Error("Given array was not defined");
        }

        if (data.length !== expected) {
            throw new Error(
                `Given array length ${data.length} was not expected ${expected}`,
            );
        }
    }

    static assertLengthGreaterThan<T>(data: T[] | undefined, expected: number): void {
        if (!data) {
            throw new Error("Given array was not defined");
        }

        if (data.length <= expected) {
            throw new Error(
                `Given array length ${data.length} was not greater than ${expected}`,
            );
        }
    }

    static assertGreaterThan(value: number, expected: number): void {
        if (value <= expected) {
            throw new Error(
                `Value ${value} was expected to be greater than ${expected}`,
            );
        }
    }

    static assertToBeCloseTo(value: number, expected: number, delta: number): void {
        expect(expected - value).toBeGreaterThanOrEqual(-1 * delta);
        expect(expected - value).toBeLessThanOrEqual(delta);
    }
}
