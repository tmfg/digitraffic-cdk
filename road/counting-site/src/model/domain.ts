export interface DbDomain {
    readonly name: string;
    readonly description: string;
    readonly created: Date;
    readonly modified: Date;
    readonly removed_timestamp?: Date;
}

export interface ResultDomain {
    readonly name: string;
    readonly description: string;
    readonly addedTimestamp: Date;
    readonly dataUpdatedTime: Date;
    readonly removedTimestamp?: Date;
}
