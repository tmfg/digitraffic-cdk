import { handler } from "../../lambda/lambda-http-headers.js";
import {
  expectResponseCorsHeaders,
  responseHandlerCall,
} from "./response-util.js";

test("GET request gets headers", async () => {
  const cb = await responseHandlerCall(handler, {
    method: "GET",
  }, {
    headers: {},
  });

  expectResponseCorsHeaders(cb);
});

test("OPTIONS request", async () => {
  const cb = await responseHandlerCall(handler, {
    method: "OPTIONS",
  }, {
    headers: {},
  });

  expectResponseCorsHeaders(cb, false);
});
