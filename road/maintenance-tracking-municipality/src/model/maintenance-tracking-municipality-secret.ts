import { type GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface MaintenanceTrackingAutoriSecret extends GenericSecret {
    readonly url: string;
    readonly productId: string;
    readonly oAuthTokenEndpoint: string;
    readonly oAuthScope: string;
    readonly oAuthClientId: string;
    readonly oAuthClientSecret: string;
}

export interface MaintenanceTrackingPaikanninSecret extends GenericSecret {
    readonly apikey: string;
    readonly url: string;
}
