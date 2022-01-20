export function assertEquals<T>(value: T, expected: T) {
    if (value != expected) {
        throw new Error(`Given value ${value} was not expected ${expected}`);
    }
}

export function assertTrue<T>(value: T) {
    if ( !value) {
        throw new Error(`Given value ${value} was not true`);
    }
}

export function assertLength<T>(data: T[], expected: number) {
    if (!data) {
        throw new Error("Given array was not defined");
    }

    if (data.length != expected) {
        throw new Error(`Given array length ${data.length} was not expected ${expected}`);
    }
}

export function assertLengthGreaterThan<T>(data: T[], expected: number) {
    if (!data) {
        throw new Error("Given array was not defined");
    }

    if (data.length <= expected) {
        throw new Error(`Given array length ${data.length} was not greater than ${expected}`);
    }
}
