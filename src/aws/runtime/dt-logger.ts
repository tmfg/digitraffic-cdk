import type { Writable } from "stream";
import { lowerFirst, mapKeys } from "lodash-es";
import { getEnvVariableOrElse } from "../../utils/utils.js";

/** Logging level */
export type LOG_LEVEL = "DEBUG" | "INFO" | "WARN" | "ERROR";
export type LoggerMethodType = `${string}.${string}`;

/**
 * Configuration object for configuring the Digitraffic logging utility
 * @see {@link DtLogger}
 */
export interface LoggerConfiguration {
    /** Name of the lambda */
    lambdaName?: string;
    /** The file name where the logging occurs */
    fileName?: string;
    /** The lambda runtime environment */
    runTime?: string;
    /** Custom end point to write the logs to */
    writeStream?: Writable;
}

interface LoggableTypeInternal extends LoggableType {
    level: LOG_LEVEL;
}

/**
 * CustomParams allows to add keys prefixed with `custom` keyword to be added to an
 * object.
 */
export interface CustomParams {
    /** do not log your apikey! */
    customApikey?: never;
    /** do not log your apikey! */
    customApiKey?: never;
    [key: `custom${Capitalize<string>}Count`]: number;

    [key: `custom${Capitalize<string>}`]:
    | string
    | number
    | bigint
    | boolean
    | Date
    // eslint-disable-next-line @rushstack/no-new-null
    | null
    | undefined;
}

/**
 * Digitraffic logging object.
 *
 * `method` property is the only required propetry. {@link CustomParams} can be added by
 * prefixin the property with keyword `custom`. The prefix is removed before writing to
 * logging end point.
 *
 * @see {@link CustomParams}
 */
export interface LoggableType extends CustomParams {
    /** Name of the method logging the message */
    method: LoggerMethodType;
    /** Message to log, optional */
    message?: string;
    /** Type of message, optional */
    type?: string;
    /** Stack trace, optional */
    stack?: string | undefined;
    /** Amount of time some operation took in milliseconds, optional */
    tookMs?: number;
    /** Pass error object, which will be stringified before logging */
    error?: unknown;
}

/**
 * Helper class for json-logging.
 *
 * Logged line will include:
 * * log-level
 * * lambdaName (taken from process environment)
 * * runtime (taken from process environment)
 * * the actual message (as json or as string)
 */
export class DtLogger {
    readonly lambdaName?: string;
    readonly runtime?: string;

    readonly writeStream: Writable;

    /**
     * Create a new Logger instance.
     * @constructor
     * @param {LoggerConfiguration?} [config] - Accepts configuration options @see {@link LoggerConfiguration}
     */
    constructor(config?: LoggerConfiguration) {
        this.lambdaName = config?.lambdaName ??
            getEnvVariableOrElse("AWS_LAMBDA_FUNCTION_NAME", "unknown lambda name");
        this.runtime = config?.runTime ?? getEnvVariableOrElse("AWS_EXECUTION_ENV", "unknown runtime");
        this.writeStream = config?.writeStream ?? process.stdout;
    }

    /**
     * Log given message with level DEBUG.  This will not be forwarded to centralized logging system!.
     *
     * @param message anything
     * @see {@link LoggableType}
     * @see {@link DtLogger.log}
     */
    debug(message: unknown): void {
        const logMessage = {
            message,
            level: "DEBUG",
            lambdaName: this.lambdaName,
            runtime: this.runtime,
        };

        this.writeStream.write(JSON.stringify(logMessage) + "\n");
    }

    /**
     * Log given message with level INFO
     *
     * @param message Json-object to log
     * @see {@link LoggableType}
     * @see {@link DtLogger.log}
     */
    info(message: LoggableType): void {
        this.log({ ...message, level: "INFO" });
    }

    /**
     * Log given message with level WARN
     *
     * @param message Json-object to log
     * @see {@link LoggableType}
     * @see {@link DtLogger.log}
     */
    warn(message: LoggableType): void {
        this.log({ ...message, level: "WARN" });
    }
    /**
     * Log given message with level INFO
     *
     * @param message Json-object to log
     * @see {@link LoggableType}
     * @see {@link DtLogger.log}
     */
    error(message: LoggableType): void {
        this.log({
            ...message,
            level: "ERROR",
        });
    }

    /**
     * Log message with given log level.
     *
     * Some metadata is also added to the message:
     * * runtime     - can be configured with constructor or inferred from environment
     * * lambdaName  - can be configured with constructor or inferred from environment
     *
     * @param message Json-object to log
     * @see {@link LoggableType}
     */
    private log(message: LoggableTypeInternal): void {
        const error = message.error
            ? typeof message.error === "string" ? message.error : JSON.stringify(message.error)
            : undefined;

        const logMessage = {
            ...removePrefix("custom", message),
            error,
            lambdaName: this.lambdaName,
            runtime: this.runtime,
        };

        this.writeStream.write(JSON.stringify(logMessage) + "\n");
    }
}

/**
 * Removes given prefixes from the keys of the object.
 */
function removePrefix(prefix: string, loggable: LoggableType): LoggableType {
    return mapKeys(
        loggable,
        (_index, key: string) => key.startsWith(prefix) ? lowerFirst(key.replace(prefix, "")) : key,
    ) as unknown as LoggableType;
}
