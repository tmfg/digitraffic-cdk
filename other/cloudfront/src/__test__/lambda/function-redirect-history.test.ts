import type {
  CloudfrontEvent,
  CloudfrontResponse,
} from "../../lambda/function-events.js";
import { handler } from "../../lambda/function-redirect-history.js";
import { createCloudfrontEvent } from "./request-util.js";

test("Function recognises correct url", () => {
  const reply = handler(
    createCloudfrontEvent("/history"),
  ) as CloudfrontResponse;

  expect(reply.statusCode).toEqual(301);
  // eslint-disable-next-line dot-notation
  expect(reply.headers["location"]!.value).toEqual("/history/");
});

test("Function does not recognises incorrect url", () => {
  const reply = handler(
    createCloudfrontEvent("/foo/history"),
  ) as CloudfrontEvent["request"];

  expect(reply.uri).toEqual("/foo/history");
});
