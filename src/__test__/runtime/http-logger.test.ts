import { afterEach, describe, expect, test, vi } from "vitest";
import { logger } from "../../aws/runtime/logging/dt-logger-default.js";
import {
  HttpLogger,
  LoggerFactory,
} from "../../aws/runtime/logging/http-logger.js";
import { WIDE_CONTEXT } from "../../aws/runtime/logging/wide-context.js";

vi.mock("../../aws/runtime/logging/dt-logger-default.js", () => ({
  logger: {
    info: vi.fn(),
  },
}));

describe("HttpLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("logs response status, metadata, content length, and duration", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);
    const httpLogger = new HttpLogger({
      context: "Port-call",
      traceId: "trace-123",
      url: "https://example.test/visits/1",
      urlTemplate: "https://example.test/visits/{id}",
    });

    vi.advanceTimersByTime(1250);
    httpLogger.logResponse(200, 512);

    expect(infoSpy).toHaveBeenCalledWith({
      method: "HttpLogger.logStatus",
      [WIDE_CONTEXT.LOGGING.CONTEXT]: "port_call",
      [WIDE_CONTEXT.TRACE_ID]: "trace-123",
      [WIDE_CONTEXT.HTTP_KEYS.URL]: "https://example.test/visits/1",
      [WIDE_CONTEXT.HTTP_KEYS.URL_TEMPLATE]: "/visits/{id}",
      [WIDE_CONTEXT.HTTP_KEYS.ERROR_TYPE]: undefined,
      [WIDE_CONTEXT.HTTP_KEYS.STATUS_CODE]: 200,
      [WIDE_CONTEXT.HTTP_KEYS.DURATION]: 1.25,
      [WIDE_CONTEXT.HTTP_KEYS.CONTENT_LENGTH]: 512,
    });
  });

  test.each([
    ["https://example.test/visits/{id}", "/visits/{id}"],
    ["http://example.test:8080/visits/{id}?a=1", "/visits/{id}?a=1"],
    ["HTTPS://example.test/visits/{id}", "/visits/{id}"],
    ["https://example.test", ""],
    ["https://example.test?a=1", "?a=1"],
    ["/visits/{id}", "/visits/{id}"],
    ["/redirect/https://other.test/{id}", "/redirect/https://other.test/{id}"],
  ])("strips scheme and host from url template %s", (template, expected) => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    new HttpLogger({
      context: "Test",
      url: "https://example.test/visits/1",
      urlTemplate: template,
    }).logResponse(200);

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        [WIDE_CONTEXT.HTTP_KEYS.URL]: "https://example.test/visits/1",
        [WIDE_CONTEXT.HTTP_KEYS.URL_TEMPLATE]: expected,
      }),
    );
  });

  test("strips host from factory and per-request url templates", () => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);
    infoSpy.mockClear();
    const factory = new LoggerFactory({
      context: "Test",
      urlTemplate: "https://example.test/default/{id}",
    });

    factory.logger("https://example.test/default/1").logResponse(200);
    factory
      .logger("https://example.test/other/1", "https://example.test/other/{id}")
      .logResponse(200);

    expect(infoSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        [WIDE_CONTEXT.HTTP_KEYS.URL_TEMPLATE]: "/default/{id}",
      }),
    );
    expect(infoSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        [WIDE_CONTEXT.HTTP_KEYS.URL_TEMPLATE]: "/other/{id}",
      }),
    );
  });

  test("logs error name and keeps status code unset when request fails", () => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);
    const httpLogger = new HttpLogger({
      context: "Test",
      url: "https://example.test",
    });

    httpLogger.logError(new TypeError("request failed"));

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "HttpLogger.logStatus",
        [WIDE_CONTEXT.LOGGING.CONTEXT]: "test",
        [WIDE_CONTEXT.HTTP_KEYS.ERROR_TYPE]: "TypeError",
        [WIDE_CONTEXT.HTTP_KEYS.STATUS_CODE]: undefined,
        [WIDE_CONTEXT.HTTP_KEYS.CONTENT_LENGTH]: undefined,
      }),
    );
  });

  test.each([
    ["string error", "Connection refused"],
    ["unknown error", { reason: "Connection refused" }],
  ])("classifies %s", (_description, error) => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);
    const httpLogger = new HttpLogger({
      context: "Test",
      url: "https://example.test",
    });

    httpLogger.logError(error);

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        [WIDE_CONTEXT.HTTP_KEYS.ERROR_TYPE]:
          typeof error === "string" ? error : "Unknown",
      }),
    );
  });
});
