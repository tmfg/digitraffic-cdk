import { HTTPError } from "ky";
import type { Dispatcher } from "undici";
import { describe, expect, test, vi } from "vitest";
import {
  createKyHooks,
  createLoggingInterceptor,
} from "../../aws/runtime/logging/http-interceptors.js";
import type { HttpLogger } from "../../aws/runtime/logging/http-logger.js";

type AnyFn = (...args: unknown[]) => unknown;

interface WrappedHandler {
  onRequestStart?: AnyFn;
  onResponseStart?: AnyFn;
  onResponseData?: AnyFn;
  onResponseEnd?: AnyFn;
  onResponseError?: AnyFn;
}

function mockHttpLogger() {
  return {
    start: vi.fn(),
    logResponse: vi.fn(),
    logError: vi.fn(),
  };
}

function asHttpLogger(mock: ReturnType<typeof mockHttpLogger>): HttpLogger {
  return mock as unknown as HttpLogger;
}

/** Runs the interceptor and returns the handler it passed on to the next dispatch. */
function intercept(
  httpLogger: ReturnType<typeof mockHttpLogger>,
  innerHandler: Record<string, unknown>,
) {
  const dispatch = vi.fn(() => true);
  const interceptor = createLoggingInterceptor(asHttpLogger(httpLogger));
  interceptor(dispatch as unknown as Dispatcher.Dispatch)(
    {} as Dispatcher.DispatchOptions,
    innerHandler as unknown as Dispatcher.DispatchHandler,
  );

  expect(dispatch).toHaveBeenCalledTimes(1);

  return (dispatch.mock.calls[0] as unknown[])[1] as WrappedHandler;
}

// Prototype methods are not own properties, as with undici's real handlers
class InnerHandler {
  onRequestStart = vi.fn();
  onResponseStart = vi.fn();
  onResponseData = vi.fn();
  onResponseEnd = vi.fn();
  onResponseError = vi.fn();
}

describe("createLoggingInterceptor", () => {
  const controller = {};

  test("exposes onRequestStart so undici accepts the handler", () => {
    const wrapped = intercept(mockHttpLogger(), new InnerHandler() as never);

    expect(typeof wrapped.onRequestStart).toBe("function");
  });

  test("starts the timer and delegates onRequestStart", () => {
    const httpLogger = mockHttpLogger();
    const inner = new InnerHandler();
    const wrapped = intercept(httpLogger, inner as never);

    wrapped.onRequestStart?.(controller, { ctx: 1 });

    expect(httpLogger.start).toHaveBeenCalledTimes(1);
    expect(inner.onRequestStart).toHaveBeenCalledWith(controller, { ctx: 1 });
  });

  test("logs status captured at response start when the response ends", () => {
    const httpLogger = mockHttpLogger();
    const inner = new InnerHandler();
    const wrapped = intercept(httpLogger, inner as never);

    const headers = {};

    wrapped.onResponseStart?.(controller, 404, headers, "Not Found");
    wrapped.onResponseData?.(controller, Buffer.alloc(42));
    wrapped.onResponseEnd?.(controller, {});

    expect(inner.onResponseStart).toHaveBeenCalledWith(
      controller,
      404,
      headers,
      "Not Found",
    );
    expect(httpLogger.logResponse).toHaveBeenCalledWith(404, 42);
    expect(inner.onResponseEnd).toHaveBeenCalledWith(controller, {});
  });

  test("logs counted bytes regardless of the content-length header", () => {
    const httpLogger = mockHttpLogger();
    const wrapped = intercept(httpLogger, new InnerHandler() as never);

    wrapped.onResponseStart?.(controller, 200, { "content-length": "999" });
    wrapped.onResponseData?.(controller, Buffer.from("abc"));
    wrapped.onResponseEnd?.(controller, {});

    expect(httpLogger.logResponse).toHaveBeenCalledWith(200, 3);
  });

  test("counts bytes of chunked responses and forwards each chunk", () => {
    const httpLogger = mockHttpLogger();
    const inner = new InnerHandler();
    const wrapped = intercept(httpLogger, inner as never);
    const first = Buffer.from("hello");
    const second = Buffer.from("world!");

    wrapped.onResponseStart?.(controller, 200, {});
    wrapped.onResponseData?.(controller, first);
    wrapped.onResponseData?.(controller, second);
    wrapped.onResponseEnd?.(controller, {});

    expect(inner.onResponseData).toHaveBeenNthCalledWith(1, controller, first);
    expect(inner.onResponseData).toHaveBeenNthCalledWith(2, controller, second);
    expect(httpLogger.logResponse).toHaveBeenCalledWith(200, 11);
  });

  test("logs zero length for an empty body without header", () => {
    const httpLogger = mockHttpLogger();
    const wrapped = intercept(httpLogger, new InnerHandler() as never);

    wrapped.onResponseStart?.(controller, 204, {});
    wrapped.onResponseEnd?.(controller, {});

    expect(httpLogger.logResponse).toHaveBeenCalledWith(204, 0);
  });

  test("logs errors and delegates onResponseError", () => {
    const httpLogger = mockHttpLogger();
    const inner = new InnerHandler();
    const wrapped = intercept(httpLogger, inner as never);
    const error = new Error("boom");

    wrapped.onResponseError?.(controller, error);

    expect(httpLogger.logError).toHaveBeenCalledWith(error);
    expect(httpLogger.logResponse).not.toHaveBeenCalled();
    expect(inner.onResponseError).toHaveBeenCalledWith(controller, error);
  });

  test("keeps status per handler instance", () => {
    const httpLogger = mockHttpLogger();
    const first = intercept(httpLogger, new InnerHandler() as never);
    const second = intercept(httpLogger, new InnerHandler() as never);

    first.onResponseStart?.(controller, 200, {});
    second.onResponseStart?.(controller, 500, {});
    first.onResponseData?.(controller, Buffer.from("a"));
    second.onResponseData?.(controller, Buffer.from("bb"));
    first.onResponseEnd?.(controller, {});
    second.onResponseEnd?.(controller, {});

    expect(httpLogger.logResponse).toHaveBeenNthCalledWith(1, 200, 1);
    expect(httpLogger.logResponse).toHaveBeenNthCalledWith(2, 500, 2);
  });
});

describe("createKyHooks", () => {
  function hook(
    name: "beforeRequest" | "beforeRetry" | "afterResponse" | "beforeError",
  ) {
    const httpLogger = mockHttpLogger();
    const hooks = createKyHooks(asHttpLogger(httpLogger));
    const fn = hooks[name]?.[0] as unknown as AnyFn;

    return { httpLogger, fn };
  }

  test.each(["beforeRequest", "beforeRetry"] as const)(
    "%s starts the timer and returns the request",
    (name) => {
      const { httpLogger, fn } = hook(name);
      const request = new Request("https://example.com");

      expect(fn({ request })).toBe(request);
      expect(httpLogger.start).toHaveBeenCalledTimes(1);
    },
  );

  test("afterResponse uses content-length header without reading the body", async () => {
    const { httpLogger, fn } = hook("afterResponse");
    const response = new Response("hello", {
      status: 200,
      headers: { "content-length": "5" },
    });
    const cloneSpy = vi.spyOn(response, "clone");

    const result = await fn({ response });

    expect(result).toBe(response);
    expect(httpLogger.logResponse).toHaveBeenCalledWith(200, 5);
    expect(cloneSpy).not.toHaveBeenCalled();
  });

  test("afterResponse leaves length unknown when header is missing and keeps body readable", async () => {
    const { httpLogger, fn } = hook("afterResponse");
    const response = new Response("hello", { status: 201 });
    const cloneSpy = vi.spyOn(response, "clone");

    const result = (await fn({ response })) as Response;

    // The body must not be read just for logging. Buffering it would hold
    // the whole payload in memory and block streaming consumers.
    expect(httpLogger.logResponse).toHaveBeenCalledWith(201, undefined);
    expect(cloneSpy).not.toHaveBeenCalled();
    expect(await result.text()).toBe("hello");
  });

  test("beforeError logs and returns non-HTTP errors", () => {
    const { httpLogger, fn } = hook("beforeError");
    const error = new Error("failed");

    expect(fn({ error })).toBe(error);
    expect(httpLogger.logError).toHaveBeenCalledWith(error);
  });

  test("beforeError does not log HTTPError again after afterResponse logged it", () => {
    const { httpLogger, fn } = hook("beforeError");
    const error = new HTTPError(
      new Response(null, { status: 500 }),
      new Request("https://example.com"),
      {} as never,
    );

    expect(fn({ error })).toBe(error);
    expect(httpLogger.logError).not.toHaveBeenCalled();
  });
});
