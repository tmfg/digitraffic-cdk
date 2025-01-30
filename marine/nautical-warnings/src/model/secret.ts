import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface NauticalWarningsSecret extends GenericSecret {
  readonly url: string;
}
