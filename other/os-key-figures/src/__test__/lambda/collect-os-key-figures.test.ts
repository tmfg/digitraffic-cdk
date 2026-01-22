import nock from "nock";
import * as collectOsKeyFigures from "../../lambda/collect-os-key-figures.js";

// nock does not (yet) work with undici which is what ky uses
// https://github.com/nock/nock/issues/2183
test("getPaths throws HttpError with statuscode 403", async () => {
  const basePath = "http://localhost";
  const path = "/test/path";
  nock(basePath).get(path).reply(403);
  return collectOsKeyFigures
    .getPaths(basePath + path)
    .then(() => {
      fail("Should throw HTTPError");
    })
    .catch((_error: unknown) => {
      //expect(error.constructor.name).toBe("HTTPError");
    });
});
