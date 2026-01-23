import {
  handler,
  NOT_ACCEPTABLE,
} from "../../lambda/lambda-gzip-requirement.js";
import {
  expectRequest,
  headersWithAcceptEncoding,
  requestHandlerCall,
} from "./request-util.js";
import { expectResponse } from "./response-util.js";

function isCloudFrontResultResponse(
  obj: unknown,
): obj is import("aws-lambda").CloudFrontResultResponse {
  return obj !== null && typeof obj === "object" && "status" in obj;
}

test("GET request without header", async () => {
  const result = await requestHandlerCall(handler, {
    method: "GET",
    headers: {},
  });
  if (isCloudFrontResultResponse(result)) {
    expectResponse(result, {
      response: NOT_ACCEPTABLE,
    });
  } else {
    throw new Error("Expected a CloudFrontResultResponse");
  }
});

test("OPTIONS request", async () => {
  const result = await requestHandlerCall(handler, {
    method: "OPTIONS",
    headers: {},
  });
  if (isCloudFrontResultResponse(result)) {
    expectResponse(result, {
      status: "204",
      headers: {
        "access-control-max-age": "86400",
      },
    });
  } else {
    throw new Error("Expected a CloudFrontResultResponse");
  }
});

test("GET request with wrong header", async () => {
  const result = await requestHandlerCall(handler, {
    method: "GET",
    headers: headersWithAcceptEncoding("br"),
  });
  if (isCloudFrontResultResponse(result)) {
    expectResponse(result, {
      status: "406",
    });
  } else {
    throw new Error("Expected a CloudFrontResultResponse");
  }
});

test("GET request with correct header", async () => {
  const result = await requestHandlerCall(handler, {
    method: "GET",
    uri: "/test-uri", // Ensure uri is present for CloudFrontRequest
    headers: headersWithAcceptEncoding("gzip"),
  });
  if (!isCloudFrontResultResponse(result)) {
    expectRequest(result, {
      method: "GET",
      uri: "/test-uri",
      headers: {
        "accept-encoding": "gzip",
      },
    });
  } else {
    throw new Error("Expected a CloudFrontRequest");
  }
});
