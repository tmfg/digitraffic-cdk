const foo = require("../../lib/lambda/lambda-add-slash.js");
const { handler } = foo;

test("Function recognises correct url", () => {
  const reply = handler({
    request: {
      uri: "https://rata.digitraffic.fi/history"
    }
  });
  expect(reply.uri).toEqual("https://rata.digitraffic.fi/history/")
})

test("Function does not recognises incorrect url", () => {
  const reply = handler({
    request: {
      uri: "https://rata.digitraffic.fi/foo/history"
    }
  });
  expect(reply.uri).toEqual("https://rata.digitraffic.fi/foo/history")
})