/**
 * Utility function for retrying async functions.
 * @param asyncFn Function
 * @param retries Amount of retries, default is 3. If set to <= 0, no retries will be done. Using non-finite numbers will throw an error. The maximum allowed retry count is 100.
 * @param logError If the promise rejects, should the error be logged? Default is false.
 */
export async function retry<T>(asyncFn: () => Promise<T>, retries = 3, logError = false): Promise<T | null> {
    if (!isFinite(retries)) {
        throw new Error('Only finite numbers are supported');
    }
    if (retries > 100) {
        throw new Error('Exceeded the maximum retry count of 100');
    }
    try {
        return await asyncFn();
    } catch (error) {
        if (logError) {
            console.error('method=retry error', error);
        }
        const remainingRetries = retries - 1;
        if (remainingRetries < 0) {
            console.warn('method=retry no retries left');
            return null;
        }
        console.warn('method=retry invocation failed, retrying with remaining retries %d', remainingRetries);
        return retry(asyncFn, remainingRetries, logError);
    }
}
