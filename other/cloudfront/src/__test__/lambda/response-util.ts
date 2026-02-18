import type {
  CloudFrontRequest,
  CloudFrontResponse,
  CloudFrontResponseEvent,
  CloudFrontResponseHandler,
  CloudFrontResultResponse,
  Context,
} from "aws-lambda";
import { AC_HEADERS } from "../../lambda/header-util.js";
import { createHeader } from "./request-util.js";

export async function responseHandlerCall(
  handler: CloudFrontResponseHandler,
  request: Partial<CloudFrontRequest>,
  response: Partial<CloudFrontResponse>,
): Promise<CloudFrontResultResponse | undefined> {
  const context = {} as unknown as Context;
  const event = {
    Records: [
      {
        cf: {
          request,
          response,
        },
      },
    ],
  } as unknown as CloudFrontResponseEvent;

  // Call the handler as an async function and return the result
  const result = await (
    handler as unknown as (
      event: CloudFrontResponseEvent,
      context: Context,
    ) => Promise<CloudFrontResultResponse | undefined>
  )(event, context);
  return result as CloudFrontResultResponse | undefined;
}

export interface ExpectedResponse {
  readonly response?: CloudFrontResultResponse;
  readonly status?: string;
  readonly headers?: Record<string, string | false>;
}

export function expectResponse(
  result: CloudFrontResultResponse | undefined,
  expected: ExpectedResponse,
): void {
  expect(result).toBeDefined();
  if (!result) return;
  if (expected.response) {
    expect(result).toEqual(expected.response);
  } else {
    // If not expecting a specific response, check status and headers
    if (expected.status) {
      expect(result.status).toEqual(expected.status);
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
}

export function expectResponseHeader(
  result: CloudFrontResultResponse | undefined,
  headerName: string,
  expected: string | false,
): void {
  expect(result).toBeDefined();
  if (!result) return;
  if (expected) {
    expect(result.headers?.[headerName.toLowerCase()]).toEqual(
      createHeader(headerName, expected)[headerName],
    );
  } else {
    expect(result.headers?.[headerName.toLowerCase()]).not.toBeDefined();
  }
}

export function expectResponseCorsHeaders(
  result: CloudFrontResultResponse | undefined,
  shouldContain: boolean = true,
): void {
  if (shouldContain) {
    expectResponseHeader(result, AC_HEADERS.ALLOW_ORIGIN, "*");
  } else {
    expectResponseHeader(result, AC_HEADERS.ALLOW_ORIGIN, false);
  }
}
