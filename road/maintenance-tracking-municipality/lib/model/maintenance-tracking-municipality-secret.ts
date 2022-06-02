export type MaintenanceTrackingAutoriSecret = {
    readonly url: string,
    readonly productId: string,
    readonly oAuthTokenEndpoint: string,
    readonly oAuthScope: string,
    readonly oAuthClientId: string,
    readonly oAuthClientSecret: string,
}

export type MaintenanceTrackingPaikanninSecret = {
    readonly apikey: string,
    readonly url: string
}