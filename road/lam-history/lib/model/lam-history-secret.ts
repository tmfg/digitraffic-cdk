import { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface LamHistorySecret extends GenericSecret {
    readonly apikey: string;
    readonly pisteUrl: string;
    readonly pistejoukkoUrl: string;
    readonly historyUrl: string;
}
