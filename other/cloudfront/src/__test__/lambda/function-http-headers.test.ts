import { handler } from "../../lambda/function-http-headers.js";
import { AC_HEADERS } from "../../lambda/header-util.js";
import { createCloudfrontEvent } from "./request-util.js";

test("check headers", () => {
  const reply = handler(
    createCloudfrontEvent("/anything"),
  );

  // eslint-disable-next-line dot-notation
  expect(reply.headers[AC_HEADERS.ALLOW_ORIGIN]!.value).toEqual("*");
  expect(reply.headers[AC_HEADERS.ALLOW_METHODS]!.value).toEqual(
    "GET, POST, OPTIONS",
  );
});
