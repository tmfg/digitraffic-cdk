import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface AtonSecret extends GenericSecret {
    readonly certificate: string;
    readonly privatekey: string;
    readonly ca: string;
    readonly serviceRegistryUrl: string;
}
