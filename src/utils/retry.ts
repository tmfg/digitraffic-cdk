import { HttpError } from "../types/http-error.js";
import { AsyncTimeoutError } from "../types/async-timeout-error.js";
import { logger } from "../aws/runtime/dt-logger-default.js";

export enum RetryLogError {
    LOG_ALL_AS_ERRORS,
    LOG_LAST_RETRY_AS_ERROR_OTHERS_AS_WARNS,
    NO_LOGGING,
}

export type TimeoutFn = (retryCount: number) => number;
export type RetryPredicate = (error: unknown) => boolean;

/**
 * Utility timeout functions for "retry" function.
 */
export const timeoutFunctions = (function() {
    return {
        noTimeout: (_: number): number => {
            return 0;
        },
        exponentialTimeout: (retryCount: number): number => {
            return 2 ** retryCount * 1000;
        },
    };
})();

/**
 * Utility retry predicates for "retry" function.
 */
export const retryPredicates = (function() {
    const retryStatusCodes = new Set([
        // service might return 403 for no apparent reason
        403,
        // Opensearch responds 429, if you make too many requests too fast
        429,
    ]);
    return {
        retryBasedOnStatusCode: (error: unknown): boolean => {
            if (error instanceof HttpError) {
                return retryStatusCodes.has(error.statusCode);
            }
            return false;
        },
        alwaysRetry: (_: unknown): boolean => {
            return true;
        },
    };
})();

function readPossibleErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return "Something else than an Error object was thrown";
}

// Tämä muuttuja on testejä varten määritelty täällä.
export let retryCount = 0;

async function retryRecursive<T>(
    asyncFn: () => Promise<T>,
    retries: number,
    retryCountInj: number,
    logError: RetryLogError,
    timeoutBetweenRetries: TimeoutFn,
    retryPredicate: RetryPredicate,
): Promise<T> {
    const asyncFnTimeout = 30 * 60 * 1000; // 30 minutes
    if (!isFinite(retries)) {
        throw new Error("Only finite numbers are supported");
    }
    if (retries > 100) {
        throw new Error("Exceeded the maximum retry count of 100");
    }
    try {
        // NOTE, a Promise cannot be cancelled. So if the asyncFn calls multiple async/await paris and the first one takes 31 minutes to complete,
        // then the rest of async/await pairs will be called even though AsyncTimeoutError is already thrown.
        const result: T = await Promise.race([
            asyncFn(),
            new Promise<never>((_resolve, reject) =>
                setTimeout(
                    () => reject(new AsyncTimeoutError()),
                    asyncFnTimeout,
                )
            ),
        ]);
        return result;
    } catch (error) {
        const remainingRetries = retries - 1;

        if (logError === RetryLogError.LOG_ALL_AS_ERRORS) {
            logger.error({
                message: readPossibleErrorMessage(error),
                method: "retry.retryRecursive",
            });
        } else if (
            logError === RetryLogError.LOG_LAST_RETRY_AS_ERROR_OTHERS_AS_WARNS
        ) {
            if (remainingRetries < 0) {
                logger.error({
                    message: readPossibleErrorMessage(error),
                    method: "retry.retryRecursive",
                });
            } else {
                logger.warn({
                    message: readPossibleErrorMessage(error),
                    method: "retry.retryRecursive",
                });
            }
        }

        if (remainingRetries < 0) {
            logger.warn({
                message: "No retries left",
                method: "retry.retryRecursive",
            });
            throw new Error("No retries left");
        }
        logger.warn({
            message: `Retrying with remaining retries ${remainingRetries}`,
            method: "retry.retryRecursive",
        });
        if (retryPredicate(error)) {
            retryCountInj++;
            retryCount = retryCountInj;
            const milliseconds = timeoutBetweenRetries(retryCountInj);
            if (milliseconds > 0) {
                await new Promise((resolve) => setTimeout(resolve, milliseconds));
            }
            return retryRecursive(
                asyncFn,
                remainingRetries,
                retryCountInj,
                logError,
                timeoutBetweenRetries,
                retryPredicate,
            );
        } else {
            throw new Error("Retry predicate failed");
        }
    }
}

/**
 * Utility function for retrying async functions.
 * @param asyncFn Function
 * @param retries Amount of retries, default is 3. If set to <= 0, no retries will be done. Using non-finite numbers will throw an error. The maximum allowed retry count is 100.
 * @param logError Logging options
 * @param timeoutBetweenRetries A function that returns the timeout between retries in milliseconds. Default is a function returning 0. The function is called with the current retry count.
 * @param retryPredicate A function that returns true if the error should be retried. Default is a function that always returns true. The function is called with the error object.
 * @return Promise return value
 */
export async function retry<T>(
    asyncFn: () => Promise<T>,
    retries: number = 3,
    logError: RetryLogError = RetryLogError.LOG_LAST_RETRY_AS_ERROR_OTHERS_AS_WARNS,
    timeoutBetweenRetries: TimeoutFn = timeoutFunctions.noTimeout,
    retryPredicate: RetryPredicate = retryPredicates.alwaysRetry,
): Promise<T> {
    retryCount = 0;

    logger.debug({
        message: `Retrying with ${retries} retries`,
        method: "retry.retry",
    });
    return retryRecursive(
        asyncFn,
        retries,
        0,
        logError,
        timeoutBetweenRetries,
        retryPredicate,
    );
}

function wrapArgsToFn<T>(
    fn: (...args: unknown[]) => Promise<T>,
    ...args: unknown[]
): () => Promise<T> {
    return async () => await fn(...args);
}

export async function retryRequest<T>(
    request: (...args: unknown[]) => Promise<T>,
    ...args: unknown[]
): Promise<T> {
    const asyncFn = wrapArgsToFn(request, ...args);
    return retry(
        asyncFn,
        5,
        RetryLogError.LOG_LAST_RETRY_AS_ERROR_OTHERS_AS_WARNS,
        timeoutFunctions.exponentialTimeout,
        retryPredicates.retryBasedOnStatusCode,
    );
}
