/**
 * Utility function for retrying async functions.
 * @param asyncFn Function
 * @param retries Amount of retries, default is 3. If set to <= 0, no retries will be done. Using NaN will throw an error.
 * @param logError If the promise rejects, should the error be logged? Default is false.
 */
export async function retry(asyncFn: () => Promise<void>, retries = 3, logError = false): Promise<void> {
    if (isNaN(retries)) {
        throw new Error('NaN is not supported');
    }
    try {
        await asyncFn();
    } catch (error) {
        if (logError) {
            console.error('method=retry error', error);
        }
        const remainingRetries = retries - 1;
        if (remainingRetries <= 0) {
            console.warn('method=retry no retries left');
            return;
        }
        console.warn('method=retry invocation failed, retrying with remaining retries %d', remainingRetries);
        return retry(asyncFn, remainingRetries, logError);
    }
}
