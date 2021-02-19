export interface Event {
    readonly uuid : string,
    readonly eventType : string,    // From event type enumeration
    readonly enumerationsource : string,
    readonly port : string,
    readonly recordTime: string     // ISO 8601 datetime with timezone, time of sending event,
    readonly eventTime: string      // ISO 8601 datetime with timezone, estimation or actual time of the event content,
    readonly ship : {               // At least one of the following identifiers must be provided, preferably IMO
        readonly imo ?: string
        readonly eni ?: string
        readonly mmsi ?: string
    },
    readonly portcallId ?: string   // Port call identifier, normally unlocode followed by unique number,
    readonly location ?: {
        readonly type : string,
        readonly name ?: string
    },
    readonly context ?: {}          // See Event context specification}
}

