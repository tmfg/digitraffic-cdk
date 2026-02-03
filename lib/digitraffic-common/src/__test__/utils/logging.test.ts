import { Writable } from "node:stream";
import { DtLogger } from "../../aws/runtime/dt-logger.js";
import {
  logException,
  truncateEnd,
  truncateMiddle,
} from "../../utils/logging.js";

interface ErrorLogLine {
  type: string;
  method: string;
  message: string | number;
  code?: string;
  level: string;
  stack?: boolean;
}

const TEST_METHODNAME = "test.logException";

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

  test("truncateEnd - not truncated as would be longer", () => {
    expect(truncateEnd("This is a test string", 10)).toBe(
      "This is a test string",
    );
  });

  test("truncateEnd", () => {
    expect(truncateEnd("This is a test string that is long enough", 10)).toBe(
      "This is a [TRUNCATED 31 CHARS]",
    );
  });

  test("truncateMiddle - not truncated as would be longer", () => {
    expect(truncateMiddle("This is a test string", 10)).toBe(
      "This is a test string",
    );
  });

  test("truncateMiddle", () => {
    expect(
      truncateMiddle("This is a test string that is long enough", 20),
    ).toBe("This is a [TRUNCATED 21 CHARS] ong enough");
  });
});
