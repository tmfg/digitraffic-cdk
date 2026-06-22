import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface UpdateAwakeAiETXTimestampsSecret extends GenericSecret {
  readonly oAuthTokenEndpoint: string;
  readonly oAuthClientId: string;
  readonly oAuthClientSecret: string;
  readonly voyagesurl: string;
  readonly voyagesauth: string;
}

export interface UpdateAwakeAiATXTimestampsSecret extends GenericSecret {
  readonly atxurl: string;
  readonly atxauth: string;
  readonly oAuthTokenEndpoint: string;
  readonly oAuthClientId: string;
  readonly oAuthClientSecret: string;
}
