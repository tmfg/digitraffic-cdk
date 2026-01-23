import type {
  CloudFrontHeaders,
  CloudFrontRequest,
  CloudFrontRequestEvent,
  CloudFrontRequestHandler,
  CloudFrontRequestResult,
  Context,
} from "aws-lambda";
import type { CloudfrontEvent } from "../../lambda/function-events.js";

export function createCloudfrontEvent(
  uri: string,
  method: string = "GET",
): CloudfrontEvent {
  return {
    request: {
      uri,
      method,
    },
    response: {
      statusCode: 200,
      headers: {},
    },
  };
}

export async function requestHandlerCall(
  handler: CloudFrontRequestHandler,
  request: Partial<CloudFrontRequest>,
): Promise<CloudFrontRequestResult | undefined> {
  const context = {} as unknown as Context;
  const event = {
    Records: [
      {
        cf: {
          request,
        },
      },
    ],
  } as unknown as CloudFrontRequestEvent;

  // Call the handler as an async function and return the result
  // Handler may return void or CloudFrontRequestResult
  const result = await (
    handler as unknown as (
      event: CloudFrontRequestEvent,
      context: Context,
    ) => Promise<CloudFrontRequestResult | void>
  )(event, context);
  return result as CloudFrontRequestResult | undefined;
}

export function createHeader(key: string, value: string): CloudFrontHeaders {
  return {
    [key]: [{ key, value }],
  };
}

export function headersWithAcceptEncoding(value: string): CloudFrontHeaders {
  return createHeader("accept-encoding", value);
}

export interface ExpectedRequest {
  readonly method: string;
  readonly uri?: string;
  readonly querystring?: string;
  readonly origin?: boolean;
  readonly headers?: Record<string, string | false>;
}

function isCloudFrontRequest(obj: unknown): obj is CloudFrontRequest {
  if (!obj || typeof obj !== "object") return false;
  // CloudFrontRequest should always have method, uri, and headers
  return (
    typeof (obj as CloudFrontRequest).method === "string" &&
    typeof (obj as CloudFrontRequest).uri === "string" &&
    typeof (obj as CloudFrontRequest).headers === "object"
  );
}

export function expectRequest(
  result: CloudFrontRequestResult | undefined,
  expected: ExpectedRequest,
): void {
  expect(result).toBeDefined();
  if (!result) return;
  if (!isCloudFrontRequest(result)) {
    throw new Error(
      "Result is not a CloudFrontRequest. Got: " + JSON.stringify(result),
    );
  }
  expect(result.method).toEqual(expected.method);

  if (expected.uri) {
    expect(result.uri).toEqual(expected.uri);
  }

  if (expected.querystring) {
    expect(result.querystring).toEqual(expected.querystring);
  }

  if (expected.origin !== undefined && expected.origin === false) {
    expect(result.origin).not.toBeDefined();
  }
  if (expected.origin !== undefined && expected.origin === true) {
    expect(result.origin).toBeDefined();
  }

  if (expected.headers) {
    Object.entries(expected.headers).forEach(([header, expectedValue]) => {
      if (expectedValue) {
        expect(result.headers?.[header.toLowerCase()]).toEqual(
          createHeader(header, expectedValue)[header],
        );
      } else {
        expect(result.headers?.[header.toLowerCase()]).not.toBeDefined();
      }
    });
  }
}
