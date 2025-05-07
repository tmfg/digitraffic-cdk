import { Writable } from "stream";
import { DtLogger } from "../../aws/runtime/dt-logger.js";
import { logException } from "../../utils/logging.js";

interface ErrorLogLine {
  type: string;
  method: string;
  message: string | number;
  code?: string;
  level: string;
  stack?: boolean;
}

const TEST_METHODNAME = "test.logException";

interface LikeAxiosError extends Error {
  code?: string;
}

describe("logging-test", () => {
  function assertLogError(
    error: Error | string,
    expected: ErrorLogLine,
    includeStack: boolean = false,
  ): void {
    assertWrite((logger: DtLogger) => {
      logException(logger, error, includeStack);
    }, expected);
  }

  function assertAxiosError(
    error: LikeAxiosError,
    expected: ErrorLogLine,
  ): void {
    assertWrite((logger: DtLogger) => {
      logException(logger, error);
    }, expected);
  }

  function assertWrite(
    writeFunction: (logger: DtLogger) => void,
    expected: ErrorLogLine,
  ): void {
    const logged: string[] = [];
    const writeStream = new Writable({
      write: (chunk: Buffer) => {
        logged.push(chunk.toString());
      },
    });

    const logger = new DtLogger({
      ...{ writeStream: writeStream },
    });

    writeFunction(logger);

    expect(logged.length).toBe(1);

    const loggedLine = JSON.parse(logged[0]!) as unknown as ErrorLogLine;
    console.info(loggedLine);

    if (expected.stack) {
      const stack = loggedLine.stack;
      delete loggedLine.stack;
      delete expected.stack;

      expect(stack).toBeDefined();
    }

    expect(loggedLine).toMatchObject(expected);
  }

  test("log error - string", () => {
    const STRING_ERROR = "string error";

    assertLogError(STRING_ERROR, {
      type: "Error",
      method: TEST_METHODNAME,
      message: `${TEST_METHODNAME} error=${STRING_ERROR} type=Error`,
      level: "ERROR",
    });
  });

  test("log error - error", () => {
    const ERROR = new Error("Errormessage");

    assertLogError(ERROR, {
      type: "Error",
      method: TEST_METHODNAME,
      message: `${TEST_METHODNAME} error=${ERROR.message} type=Error`,
      level: "ERROR",
    });
  });

  test("log error - error with stack", () => {
    const ERROR = new Error("Errormessage");

    assertLogError(
      ERROR,
      {
        type: "Error",
        method: TEST_METHODNAME,
        message: `${TEST_METHODNAME} error=${ERROR.message} type=Error`,
        level: "ERROR",
        stack: true,
      },
      true,
    );
  });

  test("log error - AxiosError", () => {
    const ERROR: LikeAxiosError = new Error("ErrorFromAxios");
    ERROR.code = "12";

    assertAxiosError(ERROR, {
      type: "Error",
      method: TEST_METHODNAME,
      message: `${TEST_METHODNAME} error=${ERROR.message} type=Error code=12`,
      level: "ERROR",
      code: ERROR.code,
    });
  });
});
