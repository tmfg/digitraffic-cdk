import {
  type CloudfrontEvent,
  type CloudfrontResponse,
  handler,
} from "../../lambda/function-redirect-history.js";

test("Function recognises correct url", () => {
  const reply = handler({
    request: {
      uri: "/history",
    },
  }) as CloudfrontResponse;

  expect(reply.statusCode).toEqual(301);
  expect(reply.headers.location.value).toEqual("/history/");
});

test("Function does not recognises incorrect url", () => {
  const reply = handler({
    request: {
      uri: "/foo/history",
    },
  }) as CloudfrontEvent["request"];

  expect(reply.uri).toEqual("/foo/history");
});
