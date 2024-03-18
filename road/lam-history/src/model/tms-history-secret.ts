import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface TmsHistorySecret extends GenericSecret {
    readonly snowflakeApikey: string;
    readonly pisteUrl: string;
    readonly pistejoukkoUrl: string;
    readonly historyUrl: string;
}
