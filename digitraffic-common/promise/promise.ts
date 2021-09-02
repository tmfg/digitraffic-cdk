/**
 * Convenience function to unwrap the value of a Promise.allSettled result.
 * @param result
 * @return Value of result or null
 */
export function valueOnFulfilled<T>(result: PromiseSettledResult<T | null>) {
    if (result.status === 'fulfilled') {
        return result.value;
    }
    return null;
}
