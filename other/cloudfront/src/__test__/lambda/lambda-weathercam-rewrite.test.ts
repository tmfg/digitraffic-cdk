import { handler } from "../../lambda/lambda-weathercam-rewrite.js";
import { expectRequest, requestHandlerCall } from "./request-util.js";

test("without version", async () => {
  const cb = await requestHandlerCall(handler, {
    uri: "/C123.jpg",
    method: "GET",
    querystring: "",
    headers: {},
  });

  expectRequest(cb, {
    method: "GET",
    uri: "/C123.jpg",
    headers: {
      "host": false,
    },
  });
});

test("with version", async () => {
  const cb = await requestHandlerCall(handler, {
    uri: "/C123.jpg",
    method: "GET",
    querystring: "versionId=123",
    headers: {},
  });

  expectRequest(cb, {
    method: "GET",
    uri: "/C123.jpg",
    querystring: "versionId=123",
    headers: {
      "host": "EXT_HOST_NAME",
    },
  });
});
