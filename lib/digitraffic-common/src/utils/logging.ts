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
 * @returns Logger that logs the error without rethrowing.
 * @see {@link logException}
 */
export function createExceptionLogger(
  logger: DtLogger | undefined = undefined,
  includeStack: boolean = false,
): (error: unknown) => void {
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
 * @param logger - DtLogger to use
 * @param error - Error or string to log
 * @param [includeStack=true] - Include stack in the message, default false
 * @returns Logs the error without rethrowing
 * @see {@link DtLogger.log}
 * @see {@link createExceptionLogger} for a curried setup
 */
export function logException(
  logger: DtLogger,
  error: unknown,
  includeStack: boolean = false,
): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  const stack =
    error instanceof Error && includeStack ? error.stack : undefined;

  logger.error({
    type: "Error",
    method: `${functionName}.logException`,
    message: `error=${message}`,
    stack,
  });
}

/**
 * Truncate string at the end if it exceeds max length.
 * @param str
 * @param max
 */
export function truncateEnd(str: string, max = 1000): string {
  if (!str) {
    return "";
  }

  const truncate = str.length - max;
  const markerLen = `[TRUNCATED ${truncate} CHARS]`.length;
  if (str.length <= max || truncate <= markerLen) {
    return str;
  }

  return `${str.slice(0, max).trim()} [TRUNCATED ${str.length - max} CHARS]`;
}

/**
 * Truncate string in the middle if it exceeds max length.
 * @param str
 * @param max
 */
export function truncateMiddle(str: string, max = 1000): string {
  if (!str) {
    return "";
  }
  const truncate = str.length - max;
  const markerLen = `[TRUNCATED ${truncate} CHARS]`.length;
  if (str.length <= max || truncate <= markerLen) {
    return str;
  }
  const half = Math.floor(max / 2);
  return `${str.slice(0, half).trim()} [TRUNCATED ${str.length - max} CHARS] ${str.slice(str.length - half).trim()}`;
}
