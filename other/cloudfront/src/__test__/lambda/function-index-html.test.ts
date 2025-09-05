import { handler } from "../../lambda/function-index-html.js";
import { createCloudfrontEvent } from "./request-util.js";

test("without /", () => {
  const request = handler(createCloudfrontEvent("/test"));

  expect(request.uri).toEqual("/test");
});

test("with /", () => {
  const request = handler(createCloudfrontEvent("/test/"));

  expect(request.uri).toEqual("/test/index.html");
});
