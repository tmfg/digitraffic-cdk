export type ApiData = {
    readonly date: string
    readonly isoDate: Date
    readonly counts: number|null
    readonly status: number|null
}

export type DbData = {
    readonly data_timestamp: Date
    readonly interval: number
    readonly count: number
    readonly status: number
}
