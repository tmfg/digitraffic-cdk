import { DtLogger } from "../aws/runtime/dt-logger.js";
import { getEnvVariableOrElse } from "./utils.js";

const functionName = getEnvVariableOrElse("AWS_LAMBDA_FUNCTION_NAME", "test");

/**
 * Curried version of logException.
 *
 * @example <caption>Using default configuration</caption>
 * Promise.reject(x).catch(createExceptionLogger())
 *
 * @example <caption>Providing external logger and requiring stack</caption>
 * import {logger} from "@digitraffic/common/dist/aws/runtime/dt-logger-default"
 * Promise.reject(x).catch(createExceptionLogger(logger, true))
 *
 * @param [logger=undefined] - DtLogger to use. If not given, will create a new instance of DtLogger
 * @param [includeStack=false] - Define if the stack trace should be logged.
 * @param error - The error instance to be logged.
 * @returns Logs the error without rethrowing.
 * @see {@link logException}
 */
export function createExceptionLogger(
    logger: DtLogger | undefined = undefined,
    includeStack = false
) {
    let thatLogger: DtLogger;
    if (logger) {
        thatLogger = logger;
    } else {
        thatLogger = new DtLogger();
    }

    return (error: unknown) => {
        logException(thatLogger, error, includeStack);
    };
}

/**
 * Log given exception with level ERROR to given logger.
 *
 * Supports AxiosError, Error and string
 *
 * @param logger - DtLogger to use
 * @param error - AxiosError, Error or string to log
 * @param [includeStack=true] - Include stack in the message, default false
 * @returns Logs the error without rethrowing
 * @see {@link DtLogger.log}
 * @see {@link createExceptionLogger} for a curried setup
 */
export function logException(
    logger: DtLogger,
    error: unknown,
    includeStack = false
) {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : JSON.stringify(error);

    const stack =
        error instanceof Error && includeStack ? error.stack : undefined;

    // In case error is AxiosError, log the custom code property.
    const customCode = (error as Record<string, string>)["code"];

    logger.error({
        type: "Error",
        method: `${functionName}.logException`,
        message,
        customCode,
        stack,
    });
}
