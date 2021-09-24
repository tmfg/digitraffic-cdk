type EPCMessageHeader = {
    readonly ShipMessageId?: string
}

export type ClientEpcMessage = {
    readonly EPCMessage?: {
        readonly EPCMessageHeader?: EPCMessageHeader[]
    }
}
