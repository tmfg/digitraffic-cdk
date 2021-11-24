/**
 * Utility function for retrying async functions.
 * @param asyncFn Function
 * @param retries Amount of retries. If set to <= 0, no retries will be done.
 * @param logError If the promise rejects, should the error be logged?
 */
export async function retry(asyncFn: () => Promise<void>, retries: number, logError: boolean): Promise<void> {
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
