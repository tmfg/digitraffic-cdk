export interface EpcMessage {
    readonly EPCMessageHeader: {
        readonly ShipMessageId: string;
    };
}
