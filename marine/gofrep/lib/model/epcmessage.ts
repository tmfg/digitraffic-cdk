export type EpcMessage = {
    readonly EPCMessage: {
        readonly EPCMessageHeader: {
            readonly ShipMessageId: string
        }
    }
}
