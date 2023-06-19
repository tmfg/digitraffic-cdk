export {};
require("dotenv").config({
    path: "./.env.test",
    override: true
});
const nock = require("nock");

const collectEsKeyFigures = require("../../lambda/collect-es-key-figures");

test("getPaths throws HttpError with statuscode 403", async () => {
    const basePath = "http://localhost";
    const path = "/test/path";
    nock(basePath).get(path).reply(403);
    return collectEsKeyFigures
        .getPaths(basePath + path)
        .then(() => {
            fail("Should throw HttpError");
        })
        .catch((error) => {
            expect(error.constructor.name).toBe("HttpError");
        });
});
