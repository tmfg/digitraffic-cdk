import { Writable } from "node:stream";
import type {
  LoggableType,
  LoggerConfiguration,
} from "../../aws/runtime/dt-logger.js";
import { DtLogger } from "../../aws/runtime/dt-logger.js";

const LOG_LINE: LoggableType = {
  method: "dt-logger.test",
  message: "FOO",
};

const EXPECTED_LOG_LINE: LoggableType = {
  method: "dt-logger.test",
  message: "dt-logger.test FOO",
};

describe("dt-logger", () => {
  function assertLog<T>(
    config: LoggerConfiguration,
    message: LoggableType,
    expected: NonNullable<T>,
  ): void {
    assertWrite(
      config,
      (logger: DtLogger) => {
        logger.info(message);
      },
      expected,
    );
  }

  function assertDebug<T>(
    config: LoggerConfiguration,
    message: unknown,
    expected: NonNullable<T>,
  ): void {
    assertWrite(
      config,
      (logger: DtLogger) => {
        logger.debug(message);
      },
      expected,
    );
  }

  function assertError<T>(
    config: LoggerConfiguration,
    message: LoggableType,
    expected: NonNullable<T>,
  ): void {
    assertWrite(
      config,
      (logger: DtLogger) => {
        logger.error(message);
      },
      expected,
    );
  }

  function assertWrite<T>(
    config: LoggerConfiguration,
    writeFunction: (logger: DtLogger) => void,
    expected: NonNullable<T>,
  ): void {
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

    const loggedLine = JSON.parse(logged[0]!) as {
      stack?: string;
      [key: string]: unknown;
    };
    console.info(loggedLine);

    if (typeof expected === "object" && "stack" in expected && expected.stack) {
      const stack = loggedLine.stack;
      expect(stack).toBeDefined();
      // stack should be multiline string
      const stackLines: string[] = (stack as string).split("\n");
      expect(stackLines.length).toBeGreaterThanOrEqual(2);
      expect(stackLines[0]).toEqual(expected.stack);

      expect(stackLines[1]?.trim()?.startsWith("at ")).toBe(true);

      delete loggedLine.stack;
      delete expected.stack;
    }

    expect(loggedLine).toMatchObject(expected);
  }

  test("custom date, number, text and '=' values", () => {
    const date = new Date();
    assertLog(
      {},
      {
        ...LOG_LINE,
        customDate: date,
        customNumber: 123,
        customText: "abc",
        customEqualsText: "foo=bar",
      },
      {
        method: EXPECTED_LOG_LINE.method,
        message: `${EXPECTED_LOG_LINE.message} date=${date.toISOString()} number=123 text=abc equalsText="foo=bar"`,
        date: date.toISOString(),
        number: 123,
        text: "abc",
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
        method: EXPECTED_LOG_LINE.method,
        message: `${EXPECTED_LOG_LINE.message} fooCount=123`,
        fooCount: 123,
      },
    );
  });

  test("default values", () => {
    assertLog({}, LOG_LINE, {
      method: EXPECTED_LOG_LINE.method,
      message: EXPECTED_LOG_LINE.message,
      level: "INFO",
    });
  });

  test("method not duplicated", () => {
    assertLog({}, EXPECTED_LOG_LINE, {
      method: EXPECTED_LOG_LINE.method,
      message: EXPECTED_LOG_LINE.message,
      level: "INFO",
    });
  });

  test("set lambdaName", () => {
    const LAMBDA_NAME = "test_lambda_name";

    assertLog({ lambdaName: LAMBDA_NAME }, LOG_LINE, {
      lambdaName: LAMBDA_NAME,
      method: EXPECTED_LOG_LINE.method,
      message: EXPECTED_LOG_LINE.message,
      level: "INFO",
    });
  });

  test("set runtime", () => {
    const RUNTIME = "test_runtime";

    assertLog({ runTime: RUNTIME }, LOG_LINE, {
      message: EXPECTED_LOG_LINE.message,
      method: EXPECTED_LOG_LINE.method,
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

  test("error - Error string", () => {
    const error = "FAIL!";
    assertError(
      {},
      {
        ...LOG_LINE,
        error,
      },
      {
        ...EXPECTED_LOG_LINE,
        error: "FAIL!",
        level: "ERROR",
      },
    );
  });

  test("error - Error object", () => {
    const error = {
      errorMessage: "FAIL!",
      errorCode: 123,
    };
    assertError(
      {},
      {
        ...LOG_LINE,
        error,
      },
      {
        ...EXPECTED_LOG_LINE,
        error: '{"errorMessage":"FAIL!","errorCode":123}',
        level: "ERROR",
      },
    );
  });

  test("error - Error", () => {
    const error = new Error("FAIL!");
    assertError(
      {},
      {
        ...LOG_LINE,
        error,
      },
      {
        ...EXPECTED_LOG_LINE,
        error: "Error: FAIL!",
        level: "ERROR",
      },
    );
  });

  test("error - Error with stack", () => {
    let error: Error | unknown;

    try {
      // @ts-expect-error
      console.log(`Result: ${undefined.length}`);
    } catch (e: unknown) {
      // @ts-expect-error
      console.debug(`Failed message: ${e.message}`);
      console.debug(`Failed stack: ${(e as Error).stack}`);
      error = e;
    }

    assertError(
      {},
      {
        ...LOG_LINE,
        error,
      },
      {
        ...EXPECTED_LOG_LINE,
        error:
          "TypeError: Cannot read properties of undefined (reading 'length')",
        level: "ERROR",
        stack:
          "TypeError: Cannot read properties of undefined (reading 'length')",
      },
    );
  });
});
