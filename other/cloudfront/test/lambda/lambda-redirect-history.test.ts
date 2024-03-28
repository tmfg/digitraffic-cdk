const lambda = require("../../lib/lambda/lambda-redirect-history.js");
const { handler } = lambda;

test("Function recognises correct url", () => {
  const reply = handler({
    request: {
      uri: "/history"
    }
  });
  expect(reply.statusCode).toEqual(301);
  expect(reply.headers.location.value).toEqual("/history/")
})

test("Function does not recognises incorrect url", () => {
  const reply = handler({
    request: {
      uri: "/foo/history"
    }
  });
  expect(reply.uri).toEqual("/foo/history")
})