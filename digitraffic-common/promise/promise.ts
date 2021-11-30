export enum RetryLogError {
    LOG_ALL_AS_ERRORS,
    LOG_LAST_RETRY_AS_ERROR_OTHERS_AS_WARNS,
    NO_LOGGING
}

/**
 * Utility function for retrying async functions.
 * @param asyncFn Function
 * @param retries Amount of retries, default is 3. If set to <= 0, no retries will be done. Using non-finite numbers will throw an error. The maximum allowed retry count is 100.
 * @param logError Logging options
 * @return Promise return value
 */
export async function retry<T>(
    asyncFn: () => Promise<T>,
    retries = 3,
    logError = RetryLogError.LOG_LAST_RETRY_AS_ERROR_OTHERS_AS_WARNS,
): Promise<T> {

    if (!isFinite(retries)) {
        throw new Error('Only finite numbers are supported');
    }
    if (retries > 100) {
        throw new Error('Exceeded the maximum retry count of 100');
    }
    try {
        return await asyncFn();
    } catch (error) {
        const remainingRetries = retries - 1;

        const errorMessage = 'method=retry error';
        if (logError === RetryLogError.LOG_ALL_AS_ERRORS) {
            console.error(errorMessage, error);
        } else if (logError === RetryLogError.LOG_LAST_RETRY_AS_ERROR_OTHERS_AS_WARNS) {
            if (remainingRetries < 0) {
                console.error(errorMessage, error);
            } else {
                console.warn(errorMessage, error);
            }
        }

        if (remainingRetries < 0) {
            console.warn('method=retry no retries left');
            throw new Error('No retries left');
        }
        console.warn('method=retry invocation failed, retrying with remaining retries %d', remainingRetries);
        return retry(
            asyncFn,
            remainingRetries,
            logError,
        );
    }
}
