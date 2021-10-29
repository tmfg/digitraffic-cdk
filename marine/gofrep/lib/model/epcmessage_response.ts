export type EpcMessageResponse = {
    readonly EPCMessageHeader: {
        readonly SentTime: string
        readonly MessageType: string
        readonly Version: string
    }
}
