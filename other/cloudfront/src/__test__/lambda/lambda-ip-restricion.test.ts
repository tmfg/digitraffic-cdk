import { handler } from "../../lambda/lambda-ip-restriction.js";
import { expectRequest, requestHandlerCall } from "./request-util.js";
import { expectResponse } from "./response-util.js";

function isCloudFrontResultResponse(
  obj: unknown,
): obj is import("aws-lambda").CloudFrontResultResponse {
  return obj !== null && typeof obj === "object" && "status" in obj;
}

test("GET request with forbidden ip", async () => {
  const result = await requestHandlerCall(handler, {
    method: "GET",
    clientIp: "FORBIDDEN",
    headers: {},
  });
  if (isCloudFrontResultResponse(result)) {
    expectResponse(result, {
      status: "403",
    });
  } else {
    throw new Error("Expected a CloudFrontResultResponse");
  }
});

test("GET request with allowed ip", async () => {
  const result = await requestHandlerCall(handler, {
    method: "GET",
    uri: "/test-uri", // Ensure uri is present for CloudFrontRequest
    clientIp: "EXT_IP",
    headers: {},
  });
  if (!isCloudFrontResultResponse(result)) {
    expectRequest(result, {
      method: "GET",
      uri: "/test-uri",
    });
  } else {
    throw new Error("Expected a CloudFrontRequest");
  }
});
