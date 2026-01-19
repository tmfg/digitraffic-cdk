import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface PortCallSecret extends GenericSecret {
  readonly url: string;
  readonly certificate: string;
  readonly privateKey: string;
}
