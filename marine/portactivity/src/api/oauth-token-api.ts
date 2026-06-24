import { URLSearchParams } from "node:url";
import ky, { HTTPError } from "ky";
import type { OAuthSecret } from "./oauth-secret.js";

export const O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS = 3 * 60 * 1000; // 3 minute safety gap to get new token

export class OAuthTokenResponse {
  readonly token_type: string;
  readonly expires_in: number;
  readonly expires: Date;
  readonly access_token: string;

  constructor(token_type: string, expires_in: number, access_token: string) {
    this.token_type = token_type;
    this.expires_in = expires_in;
    this.access_token = access_token;
    const expiresInMs = Math.max(
      0,
      expires_in * 1000 - O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS,
    );
    this.expires = new Date(Date.now() + expiresInMs);
  }

  static createFromAuthResponse(
    partialToken: Partial<OAuthTokenResponse>,
  ): OAuthTokenResponse | undefined {
    if (
      partialToken.token_type &&
      partialToken.expires_in &&
      partialToken.access_token
    ) {
      return new OAuthTokenResponse(
        partialToken.token_type,
        partialToken.expires_in,
        partialToken.access_token,
      );
    }

    return undefined;
  }

  /**
   * Checks if current auth token is still valid.
   * @private
   */
  isActive(): boolean {
    return this.expires.getTime() > Date.now();
  }
}

export class OAuthTokenApi {
  private secret: OAuthSecret;
  private oAuthResponse: OAuthTokenResponse | undefined;

  /**
   * @param secret for the domain
   */
  constructor(secret: OAuthSecret) {
    this.secret = secret;
  }

  public getOAuthToken(): Promise<OAuthTokenResponse> {
    const method = "OAuthTokenApi.getOAuthToken";

    if (this.oAuthResponse?.isActive()) {
      return Promise.resolve(this.oAuthResponse);
    }

    const postData = {
      client_id: this.secret.oAuthClientId,

      client_secret: this.secret.oAuthClientSecret,

      grant_type: "client_credentials",
    };

    const url = this.secret.oAuthTokenEndpoint;
    return ky
      .post<Partial<OAuthTokenResponse>>(url, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(postData).toString(),
      })
      .then(async (response) => {
        this.oAuthResponse = OAuthTokenResponse.createFromAuthResponse(
          await response.json(),
        );
        if (this.oAuthResponse === undefined) {
          throw new Error("Invalid OAuth token");
        }
        return this.oAuthResponse;
      })
      .catch(async (error: Error | HTTPError) => {
        const isHTTPError = error instanceof HTTPError;
        const message = isHTTPError
          ? `POST failed with message: ${error.message}`
          : `POST failed outside ky with message ${error.message}`;
        throw new Error(`${message} method=${method} url=${url}`, {
          cause: error,
        });
      });
  }
}
