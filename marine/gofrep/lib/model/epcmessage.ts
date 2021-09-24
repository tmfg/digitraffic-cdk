export type EPCMessageHeader = {
    readonly ShipMessageId?: string
}

export type EpcMessage = {
    readonly EPCMessage?: {
        readonly EPCMessageHeader?: EPCMessageHeader[]
    }
}
