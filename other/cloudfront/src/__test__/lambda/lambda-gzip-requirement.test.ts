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

test("GET request without header", async () => {
  const cb = await requestHandlerCall(handler, {
    method: "GET",
    headers: {},
  });

  expectResponse(cb, {
    response: NOT_ACCEPTABLE,
  });
});

test("OPTIONS request", async () => {
  const cb = await requestHandlerCall(handler, {
    method: "OPTIONS",
    headers: {},
  });

  expectResponse(cb, {
    status: "204",
    headers: {
      "access-control-max-age": "86400",
    },
  });
});

test("GET request with wrong header", async () => {
  const cb = await requestHandlerCall(handler, {
    method: "GET",
    headers: headersWithAcceptEncoding("br"),
  });

  expectResponse(cb, {
    status: "406",
  });
});

test("GET request with correct header", async () => {
  const cb = await requestHandlerCall(handler, {
    method: "GET",
    headers: headersWithAcceptEncoding("gzip"),
  });

  expectRequest(cb, {
    method: "GET",
    headers: {
      "accept-encoding": "gzip",
    },
  });
});
