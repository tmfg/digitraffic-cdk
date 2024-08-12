import { getEnvVariableOrElse } from "../../../utils/utils.mjs";
import { DtLogger } from "../../runtime/dt-logger.mjs";
import { LambdaResponse } from "../../types/lambda-response.mjs";

export type LoggingHandler = (
    method: () => Promise<LambdaResponse>,
    logger: DtLogger,
) => Promise<LambdaResponse>;

export type ErrorHandler = (error: unknown, logger: DtLogger) => LambdaResponse;

const functionName = getEnvVariableOrElse("AWS_LAMBDA_FUNCTION_NAME", "test");

/**
 * Factory class for creating lambda-handler functions.  You can set functionality to handle logging and error-handling,
 * with the defaults:
 * * No error handling
 * * Execution time logging
 *
 * You should instantiate HandlerFactory in your project with desired error handling and use the factory instance for
 * creating handler-functions for your lambdas.
 */
export class HandlerFactory {
    private loggingHandler: LoggingHandler;
    private errorHandler: ErrorHandler;

    constructor() {
        this.loggingHandler = async (method: () => Promise<LambdaResponse>) => {
            const start = Date.now();

            try {
                return await method();
            } finally {
                console.info("method=%s.handler tookMs=%d", functionName, Date.now() - start);
            }
        };

        this.errorHandler = (error: unknown) => {
            throw error;
        };
    }

    withLoggingHandler(loggingHandler: LoggingHandler) {
        this.loggingHandler = loggingHandler;
        return this;
    }

    withErrorHandler(errorHandler: ErrorHandler) {
        this.errorHandler = errorHandler;
        return this;
    }

    createEventHandler(handler: (event: unknown) => Promise<LambdaResponse>, logger: DtLogger) {
        return async (event: unknown) => {
            return await this.loggingHandler(async () => {
                try {
                    return await handler(event);
                } catch (error) {
                    return this.errorHandler(error, logger);
                }
            }, logger);
        };
    }
}

export function createJsonLoggingHandler(): LoggingHandler {
    return async (method: () => Promise<LambdaResponse>, logger: DtLogger) => {
        const start = Date.now();

        try {
            return await method();
        } finally {
            logger.info({
                method: `${functionName}.handler`,
                tookMs: Date.now() - start,
            });
        }
    };
}
