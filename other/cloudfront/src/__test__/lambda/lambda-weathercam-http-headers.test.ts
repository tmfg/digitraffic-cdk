import { expect, test } from "vitest";
import {
  lastModifiedHeader,
  xAmzLastModifiedHeader,
  xAmzLastModifiedHeaderUpper,
} from "../../lambda/header-util.js";
import { IMAGE_NOT_AVAILABLE_BASE64 } from "../../lambda/image-not-available.js";
import { handler } from "../../lambda/lambda-weathercam-http-headers.js";
import { createHeader } from "./request-util.js";
import { expectResponse, responseHandlerCall } from "./response-util.js";

test("last-modified from X-Amz-Meta-Last-Modified", async () => {
  const result = await responseHandlerCall(
    handler,
    {
      uri: "/moi",
      method: "GET",
      querystring: "",
      headers: {},
    },
    {
      status: "200",
      headers: createHeader(xAmzLastModifiedHeaderUpper, "value1"),
    },
  );

  expectResponse(result, {
    headers: {
      [lastModifiedHeader]: "value1",
    },
  });
});

test("last-modified from x-amz-meta-last-modified", async () => {
  const result = await responseHandlerCall(
    handler,
    {
      uri: "/moi",
      method: "GET",
      querystring: "",
      headers: {},
    },
    {
      status: "200",
      headers: {
        ...createHeader(xAmzLastModifiedHeaderUpper, "value1"),
        ...createHeader(xAmzLastModifiedHeader, "value2"),
      },
    },
  );

  expectResponse(result, {
    headers: {
      [lastModifiedHeader]: "value2",
    },
  });
});

test("403 from S3 returns image-not-available placeholder", async () => {
  const result = await responseHandlerCall(
    handler,
    {
      uri: "/C1234501.jpg",
      method: "GET",
      querystring: "",
      headers: {},
    },
    {
      status: "403",
      headers: {
        ...createHeader("transfer-encoding", "chunked"),
        ...createHeader("content-length", "243"),
        ...createHeader("content-type", "application/xml"),
      },
    },
  );

  expect(result).toBeDefined();
  expect(result?.status).toEqual("200");
  expect(result?.statusDescription).toEqual("OK");
  expect(result?.body).toEqual(IMAGE_NOT_AVAILABLE_BASE64);
  expect(result?.bodyEncoding).toEqual("base64");
  expect(result?.headers?.["content-type"]).toEqual([
    { key: "Content-Type", value: "image/jpeg" },
  ]);
  expect(result?.headers?.["cache-control"]).toEqual([
    { key: "Cache-Control", value: "no-cache" },
  ]);
  // Read-only headers from S3 are intentionally left untouched
  expect(result?.headers?.["transfer-encoding"]).toEqual(
    createHeader("transfer-encoding", "chunked")["transfer-encoding"],
  );
});

test("404 from S3 returns image-not-available placeholder", async () => {
  const result = await responseHandlerCall(
    handler,
    {
      uri: "/C1234501.jpg",
      method: "GET",
      querystring: "",
      headers: {},
    },
    {
      status: "404",
      headers: {},
    },
  );

  expect(result).toBeDefined();
  expect(result?.status).toEqual("200");
  expect(result?.body).toEqual(IMAGE_NOT_AVAILABLE_BASE64);
  expect(result?.bodyEncoding).toEqual("base64");
  expect(result?.headers?.["content-type"]).toEqual([
    { key: "Content-Type", value: "image/jpeg" },
  ]);
  expect(result?.headers?.["cache-control"]).toEqual([
    { key: "Cache-Control", value: "no-cache" },
  ]);
});

test("200 from S3 passes through normally", async () => {
  const result = await responseHandlerCall(
    handler,
    {
      uri: "/C1234501.jpg",
      method: "GET",
      querystring: "",
      headers: {},
    },
    {
      status: "200",
      headers: createHeader(xAmzLastModifiedHeader, "2025-01-01T00:00:00Z"),
    },
  );

  expect(result).toBeDefined();
  expect(result?.status).toEqual("200");
  expect(result?.body).toBeUndefined();
  expectResponse(result, {
    headers: {
      [lastModifiedHeader]: "2025-01-01T00:00:00Z",
    },
  });
});
