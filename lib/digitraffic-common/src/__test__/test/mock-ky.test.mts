import { mockKyResponse } from "../../test/mock-ky.mjs";
import { describe, test, jest } from "@jest/globals";

const ky = (await import("ky")).default;

describe("mockKyResponse", () => {
    const testObj = { test: "data" };
    const testJson = JSON.stringify(testObj);
    const url = "https://example.com";

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("works with all methods", async () => {
        jest.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
        jest.spyOn(ky, "post").mockImplementation(() => mockKyResponse(200, testJson));
        jest.spyOn(ky, "put").mockImplementation(() => mockKyResponse(200, testJson));
        jest.spyOn(ky, "delete").mockImplementation(() => mockKyResponse(200, testJson));

        expect(await ky.get(url).text()).toEqual(testJson);
        expect(await ky.put(url).text()).toEqual(testJson);
        expect(await ky.post(url).text()).toEqual(testJson);
        expect(await ky.delete(url).text()).toEqual(testJson);
    });

    test("returns correct status", async () => {
        jest.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
        expect((await ky.get(url)).status).toEqual(200);

        jest.spyOn(ky, "get").mockImplementation(() => mockKyResponse(400, testJson));
        expect((await ky.get(url)).status).toEqual(400);
    });

    test("returns correct ok", async () => {
        jest.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
        expect((await ky.get(url)).ok).toEqual(true);

        jest.spyOn(ky, "get").mockImplementation(() => mockKyResponse(299, testJson));
        expect((await ky.get(url)).ok).toEqual(true);

        jest.spyOn(ky, "get").mockImplementation(() => mockKyResponse(300, testJson));
        expect((await ky.get(url)).ok).toEqual(false);
    });

    test("convenience methods work: text", async () => {
        jest.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
        expect(await ky.get(url).text()).toEqual(testJson);
        expect(await (await ky.get(url)).text()).toEqual(testJson);
    });

    test("convenience methods work: json", async () => {
        jest.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
        expect(await ky.get(url).json()).toEqual(testObj);
        expect(await (await ky.get(url)).json()).toEqual(testObj);
    });
});
