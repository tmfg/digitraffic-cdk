import { handler } from "../../lambda/function-redirect.js";
import { createCloudfrontEvent } from "./request-util.js";

test("Function recognises correct url", () => {
  const reply = handler(
    createCloudfrontEvent("/anything"),
  );

  expect(reply.statusCode).toEqual(302);
  // eslint-disable-next-line dot-notation
  expect(reply.headers["location"]!.value).toEqual("EXT_REDIRECT_URL");
});
