import { handler } from "../../lambda/lambda-ip-restriction.js";
import { expectRequest, requestHandlerCall } from "./request-util.js";
import { expectResponse } from "./response-util.js";

test("GET request with forbidden ip", async () => {
  const cb = await requestHandlerCall(handler, {
    method: "GET",
    clientIp: "FORBIDDEN",
    headers: {},
  });

  expectResponse(cb, {
    status: "403",
  });
});

test("GET request with allowed ip", async () => {
  const cb = await requestHandlerCall(handler, {
    method: "GET",
    clientIp: "EXT_IP",
    headers: {},
  });

  expectRequest(cb, {
    method: "GET",
  });
});
