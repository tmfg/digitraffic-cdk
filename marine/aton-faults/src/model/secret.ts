import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

// TODO: remove this obsolete model. ATON certificate use was removed in DPO-3421 (f939d6ee7).
export interface AtonSecret extends GenericSecret {
  readonly certificate: string;
  readonly privatekey: string;
  readonly ca: string;
  readonly serviceRegistryUrl: string;
}
