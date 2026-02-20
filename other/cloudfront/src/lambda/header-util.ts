import type { CloudfrontResponse } from "./function-events.js";

interface Response {
  headers: Record<
    string,
    | {
        key?: string | undefined;
        value: string;
      }[]
    | undefined
  >;
}

export const AC_HEADERS = {
  ALLOW_ORIGIN: "access-control-allow-origin",
  ALLOW_METHODS: "access-control-allow-methods",
  ALLOW_HEADERS: "access-control-allow-headers",
  EXPOSE_HEADERS: "access-control-expose-headers",
} as const;

export function addCorsHeadersToFunctionResponse(
  response: CloudfrontResponse,
): void {
  const responseHeaders = response.headers;

  responseHeaders[AC_HEADERS.ALLOW_ORIGIN] = {
    value: "*",
  };

  responseHeaders[AC_HEADERS.ALLOW_METHODS] = {
    value: "GET, POST, OPTIONS",
  };

  responseHeaders[AC_HEADERS.ALLOW_HEADERS] = {
    value:
      "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Digitraffic-User",
  };

  responseHeaders[AC_HEADERS.EXPOSE_HEADERS] = {
    value:
      "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Digitraffic-User",
  };
}

export function addCorsHeadersToLambdaResponse(response: Response): void {
  const responseHeaders = response.headers;
  responseHeaders[AC_HEADERS.ALLOW_ORIGIN] = [
    {
      key: AC_HEADERS.ALLOW_ORIGIN,
      value: "*",
    },
  ];
  responseHeaders[AC_HEADERS.ALLOW_METHODS] = [
    {
      key: AC_HEADERS.ALLOW_METHODS,
      value: "GET, POST, OPTIONS",
    },
  ];
  responseHeaders[AC_HEADERS.ALLOW_HEADERS] = [
    {
      key: AC_HEADERS.ALLOW_HEADERS,
      value:
        "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Digitraffic-User",
    },
  ];
  responseHeaders[AC_HEADERS.EXPOSE_HEADERS] = [
    {
      key: AC_HEADERS.EXPOSE_HEADERS,
      value:
        "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Digitraffic-User",
    },
  ];
}

export const xAmzLastModifiedHeader = "x-amz-meta-last-modified" as const;
export const xAmzLastModifiedHeaderUpper = "X-Amz-Meta-Last-Modified" as const;
export const lastModifiedHeader = "last-modified" as const;

export function addWeathercamImageLastModifiedHeaderFromXAmzMeta(
  response: Response,
): void {
  const responseHeaders = response.headers;
  if (
    responseHeaders[xAmzLastModifiedHeader] &&
    responseHeaders[xAmzLastModifiedHeader][0]
  ) {
    responseHeaders[lastModifiedHeader] = [
      {
        key: lastModifiedHeader,
        value: responseHeaders[xAmzLastModifiedHeader][0].value,
      },
    ];
  } else if (
    responseHeaders[xAmzLastModifiedHeaderUpper] &&
    responseHeaders[xAmzLastModifiedHeaderUpper][0]
  ) {
    responseHeaders[lastModifiedHeader] = [
      {
        key: lastModifiedHeader,
        value: responseHeaders[xAmzLastModifiedHeaderUpper][0].value,
      },
    ];
  }
}

export function createAndLogError(method: string, message: string): Error {
  // eslint-disable-next-line no-console
  console.error({
    method,
    message,
  });
  return Error(message);
}
