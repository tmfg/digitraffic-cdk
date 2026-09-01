import { expect, test } from "vitest";
import { handler, rewriteUri } from "../../lambda/lambda-directory-index.js";
import { expectRequest, requestHandlerCall } from "./request-util.js";

// Production gets this value from the synth-time EXT_PATHS_TO_REMOVE replacement.
const LEADING_PATH_SEGMENTS_TO_REMOVE = 1;

test("file request is not rewritten", () => {
  const uri = rewriteUri(
    "/roadnetwork/latest/data.zip",
    "",
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );

  expect(uri).toEqual("/latest/data.zip");
});

test("directory request gets index.html", () => {
  const uri = rewriteUri(
    "/roadnetwork/latest/",
    "",
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );

  expect(uri).toEqual("/latest/index.html");
});

test("directory request with query string is left for the bucket listing", () => {
  const uri = rewriteUri(
    "/roadnetwork/",
    "list-type=2",
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );

  expect(uri).toEqual("/");
});

test("directory request with a language query gets index.html", () => {
  const uri = rewriteUri(
    "/roadnetwork/",
    "lang=en",
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );

  expect(uri).toEqual("/index.html");
});

test("directory request without querystring gets index.html", () => {
  const uri = rewriteUri("/roadnetwork/", "", LEADING_PATH_SEGMENTS_TO_REMOVE);

  expect(uri).toEqual("/index.html");
});

test("two different origins stripping the same segment count never produce colliding cache keys via the rewritten uri, since this runs after the cache decision", () => {
  // Both would previously rewrite to the identical "/assets/config.js" - the whole point of
  // moving this to an origin-request lambda is that this no longer matters for caching,
  // since the cache lookup already happened using the original, distinct request paths.
  const tmc = rewriteUri(
    "/tmc/assets/config.js",
    "",
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );
  const roadnetwork = rewriteUri(
    "/roadnetwork/assets/config.js",
    "",
    LEADING_PATH_SEGMENTS_TO_REMOVE,
  );

  expect(tmc).toEqual("/assets/config.js");
  expect(roadnetwork).toEqual("/assets/config.js");
});

test("handler reads the request from the origin-request event and rewrites its uri", async () => {
  const result = await requestHandlerCall(handler, {
    uri: "/some/file.zip",
    method: "GET",
    querystring: "",
    headers: {},
  });

  expectRequest(result, { method: "GET" });
});
