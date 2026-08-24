import { expect, test } from "vitest";
import { handler } from "../../lambda/function-directory-index.js";
import { createCloudfrontEvent } from "./request-util.js";

// Production gets this value from the synth-time EXT_PATHS_TO_REMOVE replacement.
const LEADING_PATH_SEGMENTS_TO_REMOVE = 1;

test("file request is not rewritten", () => {
  const request = handler(
    createCloudfrontEvent("/roadnetwork/latest/data.zip"),
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );

  expect(request.uri).toEqual("/latest/data.zip");
});

test("directory request gets index.html", () => {
  const request = handler(
    createCloudfrontEvent("/roadnetwork/latest/"),
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );

  expect(request.uri).toEqual("/latest/index.html");
});

test("directory request with query string is left for the bucket listing", () => {
  const request = handler(
    createCloudfrontEvent("/roadnetwork/", "GET", {
      "list-type": { value: "2" },
    }),
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );

  expect(request.uri).toEqual("/");
});

test("directory request with a language query gets index.html", () => {
  const request = handler(
    createCloudfrontEvent("/roadnetwork/", "GET", { lang: { value: "en" } }),
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );

  expect(request.uri).toEqual("/index.html");
});
