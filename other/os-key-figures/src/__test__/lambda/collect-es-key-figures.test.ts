import dotenv from "dotenv";
dotenv.config({
    path: "./.env.test",
    override: true
});
import nock from "nock";
import * as collectOsKeyFigures from "../../lambda/collect-os-key-figures.js";

test("getPaths throws HttpError with statuscode 403", async () => {
    const basePath = "http://localhost";
    const path = "/test/path";
    nock(basePath).get(path).reply(403);
    return collectOsKeyFigures
        .getPaths(basePath + path)
        .then(() => {
            fail("Should throw HttpError");
        })
        .catch((error: any) => {
            expect(error.constructor.name).toBe("HttpError");
        });
});
