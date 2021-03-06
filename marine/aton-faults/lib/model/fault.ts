interface Fault {
    readonly id: number
    readonly entry_timestamp: Date
    readonly fixed_timestamp?: Date
    readonly domain: string
    readonly state: string
    readonly type: string
    readonly fixed: boolean
    readonly aton_id: number
    readonly aton_name_fi: string
    readonly aton_name_se: string
    readonly aton_type_fi: string
    readonly fairway_number: number
    readonly fairway_name_fi: number
    readonly fairway_name_se: number
    readonly area_number: number
    readonly geometry: any
}
