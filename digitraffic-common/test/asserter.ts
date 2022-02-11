/**
 * A simple asserter-class for writing canaries without dependency to testing-libraries.
 */

export abstract class Asserter {
    static assertEquals<T>(value: T, expected: T) {
        if (value != expected) {
            throw new Error(`Given value ${value} was not expected ${expected}`);
        }
    }

    static assertTrue<T>(value: T) {
        if (!value) {
            throw new Error(`Given value ${value} was not true`);
        }
    }

    static assertLength<T>(data: T[], expected: number) {
        if (!data) {
            throw new Error("Given array was not defined");
        }

        if (data.length != expected) {
            throw new Error(`Given array length ${data.length} was not expected ${expected}`);
        }
    }

    static assertLengthGreaterThan<T>(data: T[], expected: number) {
        if (!data) {
            throw new Error("Given array was not defined");
        }

        if (data.length <= expected) {
            throw new Error(`Given array length ${data.length} was not greater than ${expected}`);
        }
    }

    static assertGreaterThan(value: number, expected: number) {
        if (value <= expected) {
            throw new Error(`Value ${value} was expected to be greater than ${expected}`);
        }
    }
}