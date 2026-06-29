import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface OAuthSecret extends GenericSecret {
  readonly oAuthTokenEndpoint: string;
  readonly oAuthClientId: string;
  readonly oAuthClientSecret: string;
}
