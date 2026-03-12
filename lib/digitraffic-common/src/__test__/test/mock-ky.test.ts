import { afterEach, describe, expect, test, vi } from "vitest";
import { mockKyResponse } from "../../__test__/mock-ky.js";

const ky = (await import("ky")).default;

describe("mockKyResponse", () => {
  const testObj = { test: "data" };
  const testJson = JSON.stringify(testObj);
  const url = "https://example.com";

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("works with all methods", async () => {
    vi.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
    vi.spyOn(ky, "post").mockImplementation(() =>
      mockKyResponse(200, testJson),
    );
    vi.spyOn(ky, "put").mockImplementation(() => mockKyResponse(200, testJson));
    vi.spyOn(ky, "delete").mockImplementation(() =>
      mockKyResponse(200, testJson),
    );

    expect(await ky.get(url).text()).toEqual(testJson);
    expect(await ky.put(url).text()).toEqual(testJson);
    expect(await ky.post(url).text()).toEqual(testJson);
    expect(await ky.delete(url).text()).toEqual(testJson);
  });

  test("returns correct status", async () => {
    vi.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
    expect((await ky.get(url)).status).toEqual(200);

    vi.spyOn(ky, "get").mockImplementation(() => mockKyResponse(400, testJson));
    expect((await ky.get(url)).status).toEqual(400);
  });

  test("returns correct ok", async () => {
    vi.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
    expect((await ky.get(url)).ok).toEqual(true);

    vi.spyOn(ky, "get").mockImplementation(() => mockKyResponse(299, testJson));
    expect((await ky.get(url)).ok).toEqual(true);

    vi.spyOn(ky, "get").mockImplementation(() => mockKyResponse(300, testJson));
    expect((await ky.get(url)).ok).toEqual(false);
  });

  test("convenience methods work: text", async () => {
    vi.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
    expect(await ky.get(url).text()).toEqual(testJson);
    expect(await (await ky.get(url)).text()).toEqual(testJson);
  });

  test("convenience methods work: json", async () => {
    vi.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, testJson));
    expect(await ky.get(url).json()).toEqual(testObj);
    expect(await (await ky.get(url)).json()).toEqual(testObj);
  });
});
