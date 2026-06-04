import { beforeEach, describe, expect, test, vi } from "vitest";
import { NemoApi } from "../../api/nemo-api.js";

vi.mock("undici", () => ({
  Agent: vi.fn().mockImplementation(() => ({})),
  request: vi.fn(),
}));

import { request } from "undici";

const mockRequest = vi.mocked(request);

describe("nemo-api-tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("createUrl", () => {
    test("formats dates correctly", () => {
      const api = new NemoApi("https://api.example.com", "key", "cert");
      const from = new Date("2025-03-25T08:28:09.681Z");
      const to = new Date("2025-03-26T10:00:00.000Z");

      const url = api.createUrl(from, to);

      expect(url).toBe(
        "https://api.example.com/2025-03-25T08:28:09Z/2025-03-26T10:00:00Z",
      );
    });
  });

  describe("getVisits", () => {
    test("calls request with a URL object, not a plain string", async () => {
      mockRequest.mockResolvedValue({
        statusCode: 200,
        body: { json: async () => [] },
      } as never);

      const api = new NemoApi("https://api.example.com", "key", "cert");
      await api.getVisits(
        new Date("2025-01-01T00:00:00Z"),
        new Date("2025-01-02T00:00:00Z"),
      );

      const [urlArg] = mockRequest.mock.calls[0]!;
      expect(urlArg).toBeInstanceOf(URL);
      expect((urlArg as URL).hostname).toBe("api.example.com");
    });

    test("rejects on non-200 status code", async () => {
      mockRequest.mockResolvedValue({
        statusCode: 503,
        body: { json: async () => null },
      } as never);

      const api = new NemoApi("https://api.example.com", "key", "cert");
      await expect(
        api.getVisits(
          new Date("2025-01-01T00:00:00Z"),
          new Date("2025-01-02T00:00:00Z"),
        ),
      ).rejects.toBeUndefined();
    });
  });
});
