import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface ShiplightSecret extends GenericSecret {
  readonly lightsControlApiKey: string;
  readonly lightsControlEndpointUrl: string;
  readonly visibilityApiKey: string;
  readonly visibilityEndpointUrl: string;
}
