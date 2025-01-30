import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface MarinecamSecret extends GenericSecret {
  readonly url: string;
  readonly username: string;
  readonly password: string;
  readonly certificate: string;
  readonly ca: string;
}
