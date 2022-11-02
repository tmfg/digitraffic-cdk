export interface EpcMessageResponse {
    readonly EPCMessageHeader: {
        readonly SentTime: string;
        readonly MessageType: number;
        readonly Version: string;
    };
}
