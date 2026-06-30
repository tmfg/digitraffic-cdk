import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { OAuthSecret } from "../../api/oauth-secret.js";
import {
  O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS,
  OAuthTokenApi,
  OAuthTokenResponse,
} from "../../api/oauth-token-api.js";

const mockSecret: OAuthSecret = {
  oAuthTokenEndpoint: "https://auth.example.com/token",
  oAuthClientId: "test-client-id",
  oAuthClientSecret: "test-client-secret",
};

const mockTokenResponse = {
  token_type: "Bearer",
  expires_in: 3600,
  access_token: "test-access-token",
};

vi.mock("ky", () => ({
  default: {
    post: vi.fn(),
  },
  HTTPError: class HTTPError extends Error {},
}));

import ky from "ky";

describe("OAuthTokenResponse", () => {
  test("constructor sets expiry with safety delta", () => {
    const before = Date.now();
    const response = new OAuthTokenResponse("Bearer", 3600, "token");
    const after = Date.now();

    const expectedMinExpiry =
      before + 3600 * 1000 - O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS;
    const expectedMaxExpiry =
      after + 3600 * 1000 - O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS;

    expect(response.expires.getTime()).toBeGreaterThanOrEqual(
      expectedMinExpiry,
    );
    expect(response.expires.getTime()).toBeLessThanOrEqual(expectedMaxExpiry);
  });

  test("constructor clamps negative expiry to zero", () => {
    const before = Date.now();
    // expires_in of 1 second is less than the 3 minute safety delta
    const response = new OAuthTokenResponse("Bearer", 1, "token");
    const after = Date.now();

    expect(response.expires.getTime()).toBeGreaterThanOrEqual(before);
    expect(response.expires.getTime()).toBeLessThanOrEqual(after);
  });

  test("isActive returns true when token not expired", () => {
    const response = new OAuthTokenResponse("Bearer", 3600, "token");
    expect(response.isActive()).toBe(true);
  });

  test("isActive returns false when token expired", () => {
    vi.useFakeTimers();
    const response = new OAuthTokenResponse("Bearer", 3600, "token");
    // advance past expiry
    vi.advanceTimersByTime(3600 * 1000);
    expect(response.isActive()).toBe(false);
    vi.useRealTimers();
  });

  test("createFromAuthResponse returns token when all fields present", () => {
    const result = OAuthTokenResponse.createFromAuthResponse(mockTokenResponse);
    expect(result).toBeDefined();
    expect(result!.access_token).toBe("test-access-token");
    expect(result!.token_type).toBe("Bearer");
    expect(result!.expires_in).toBe(3600);
  });

  test("createFromAuthResponse returns undefined when missing token_type", () => {
    const result = OAuthTokenResponse.createFromAuthResponse({
      expires_in: 3600,
      access_token: "token",
    });
    expect(result).toBeUndefined();
  });

  test("createFromAuthResponse returns undefined when missing access_token", () => {
    const result = OAuthTokenResponse.createFromAuthResponse({
      token_type: "Bearer",
      expires_in: 3600,
    });
    expect(result).toBeUndefined();
  });

  test("createFromAuthResponse returns undefined when missing expires_in", () => {
    const result = OAuthTokenResponse.createFromAuthResponse({
      token_type: "Bearer",
      access_token: "token",
    });
    expect(result).toBeUndefined();
  });
});

describe("OAuthTokenApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function mockKyPost(responseBody: object) {
    vi.mocked(ky.post).mockReturnValue({
      // biome-ignore lint/suspicious/noThenProperty: intentional mock of thenable interface
      then: (onFulfilled: (response: unknown) => unknown) =>
        Promise.resolve(
          onFulfilled({ json: () => Promise.resolve(responseBody) }),
        ),
    } as ReturnType<typeof ky.post>);
  }

  test("fetches token on first call", async () => {
    mockKyPost(mockTokenResponse);

    const api = new OAuthTokenApi(mockSecret);
    const token = await api.getOAuthToken();

    expect(token.access_token).toBe("test-access-token");
    expect(ky.post).toHaveBeenCalledOnce();
  });

  test("returns cached token on subsequent calls while active", async () => {
    mockKyPost(mockTokenResponse);

    const api = new OAuthTokenApi(mockSecret);
    const token1 = await api.getOAuthToken();
    const token2 = await api.getOAuthToken();

    expect(token1).toBe(token2);
    expect(ky.post).toHaveBeenCalledOnce();
  });

  test("refreshes token after expiry", async () => {
    vi.useFakeTimers();
    mockKyPost(mockTokenResponse);

    const api = new OAuthTokenApi(mockSecret);
    await api.getOAuthToken();

    // advance past expiry (3600s minus 3min safety = 3420s effective)
    vi.advanceTimersByTime(3600 * 1000);

    mockKyPost({ ...mockTokenResponse, access_token: "refreshed-token" });
    const token = await api.getOAuthToken();

    expect(token.access_token).toBe("refreshed-token");
    expect(ky.post).toHaveBeenCalledTimes(2);
  });

  test("throws on invalid token response", async () => {
    mockKyPost({ token_type: "Bearer" }); // missing fields

    const api = new OAuthTokenApi(mockSecret);
    await expect(api.getOAuthToken()).rejects.toThrow("Invalid OAuth token");
  });

  test("sends correct request parameters", async () => {
    mockKyPost(mockTokenResponse);

    const api = new OAuthTokenApi(mockSecret);
    await api.getOAuthToken();

    expect(ky.post).toHaveBeenCalledWith(
      "https://auth.example.com/token",
      expect.objectContaining({
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: expect.stringContaining("client_id=test-client-id"),
      }),
    );
  });
});
