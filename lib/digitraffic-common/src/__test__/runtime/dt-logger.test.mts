import { Writable } from "stream";
import { DtLogger, type LoggerConfiguration } from "../../aws/runtime/dt-logger.mjs";
import type { LoggableType } from "../../aws/runtime/dt-logger.mjs";

const LOG_LINE: LoggableType = {
    method: "dt-logger.test",
    message: "FOO",
};

describe("dt-logger", () => {
    function assertLog<T>(config: LoggerConfiguration, message: LoggableType, expected: NonNullable<T>) {
        assertWrite(
            config,
            (logger: DtLogger) => {
                logger.info(message);
            },
            expected,
        );
    }

    function assertDebug<T>(config: LoggerConfiguration, message: unknown, expected: NonNullable<T>) {
        assertWrite(
            config,
            (logger: DtLogger) => {
                logger.debug(message);
            },
            expected,
        );
    }

    function assertWrite<T>(
        config: LoggerConfiguration,
        writeFunction: (logger: DtLogger) => void,
        expected: NonNullable<T>,
    ) {
        const logged: string[] = [];
        const writeStream = new Writable({
            write: (chunk: Buffer) => {
                logged.push(chunk.toString());
            },
        });

        const logger = new DtLogger({
            ...config,
            ...{ writeStream: writeStream },
        });

        writeFunction(logger);

        expect(logged.length).toBe(1);

        const loggedLine = JSON.parse(logged[0]!) as Record<string, unknown>;
        console.info(loggedLine);

        if (typeof expected === "object" && "stack" in expected && expected.stack) {
            const stack = loggedLine["stack"];
            delete loggedLine["stack"];
            delete expected.stack;

            expect(stack).toBeDefined();
        }

        expect(loggedLine).toMatchObject(expected);
    }

    test("custom values", () => {
        const date = new Date();
        assertLog(
            {},
            {
                ...LOG_LINE,
                customDate: date,
            },
            {
                ...LOG_LINE,
                date: date.toISOString(),
            },
        );
    });

    test("custom count should be a number", () => {
        assertLog(
            {},
            {
                ...LOG_LINE,
                customFooCount: 123,
            },
            {
                ...LOG_LINE,
                fooCount: 123,
            },
        );
    });

    test("default values", () => {
        assertLog({}, LOG_LINE, {
            method: LOG_LINE.method,
            message: LOG_LINE.message,
            level: "INFO",
        });
    });

    test("set lambdaName", () => {
        const LAMBDA_NAME = "test_lambda_name";

        assertLog({ lambdaName: LAMBDA_NAME }, LOG_LINE, {
            lambdaName: LAMBDA_NAME,
            method: LOG_LINE.method,
            message: LOG_LINE.message,
            level: "INFO",
        });
    });

    test("set runtime", () => {
        const RUNTIME = "test_runtime";

        assertLog({ runTime: RUNTIME }, LOG_LINE, {
            message: LOG_LINE.message,
            method: LOG_LINE.method,
            level: "INFO",
            runtime: RUNTIME,
        });
    });

    test("debug - string", () => {
        const DEBUG_STRING = "debug string";

        assertDebug({}, DEBUG_STRING, {
            message: DEBUG_STRING,
            level: "DEBUG",
        });
    });

    test("debug - json", () => {
        const DEBUG_JSON = {
            debug: "debug",
            thing: 42,
        };

        assertDebug({}, DEBUG_JSON, {
            message: {
                debug: "debug",
                thing: 42,
            },
            level: "DEBUG",
        });
    });
});
