export type UploadVoyagePlanEvent = {
    /**
     * Endpoint URL for callback
     */
    readonly callbackEndpoint?: string

    /**
     * The route in RTZ format
     */
    readonly voyagePlan: string
}

export type SendFaultEvent = {
    /**
     * Endpoint URL for callback
     */
    readonly callbackEndpoint: string

    /**
     * Fault id
     */
    readonly faultId: number
}
