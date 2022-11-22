export interface DbDomain {
    readonly name: string;
    readonly description: string;
    readonly added_timestamp: Date;
    readonly removed_timestamp?: Date;
}

export interface ResultDomain {
    readonly name: string;
    readonly description: string;
    readonly addedTimestamp: Date;
    readonly removedTimestamp?: Date;
}
