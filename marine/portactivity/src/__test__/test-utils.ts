// eslint-disable-next-line @rushstack/no-new-null
export function assertDefined<T>(value: T | null | undefined): asserts value is T {
    if (!value) {
        throw new Error(`value is null or undefined`);
    }
}
