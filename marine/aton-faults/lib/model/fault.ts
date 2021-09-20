export interface Fault {
    readonly id: number
    readonly entry_timestamp: Date
    readonly fixed_timestamp?: Date
    readonly domain: string
    readonly state: FaultState
    readonly type: string
    readonly fixed: boolean
    readonly aton_id: number
    readonly aton_name_fi: string
    readonly aton_name_sv: string
    readonly aton_type_fi: string
    readonly fairway_number: number
    readonly fairway_name_fi: number
    readonly fairway_name_sv: number
    readonly area_number: number
    readonly geometry: any
}

export enum FaultState {
    Avoin = 'Avoin',
    Kirjattu = 'Kirjattu',
    Peruttu = 'Peruttu',
    Korjattu = 'Korjattu',
    Aiheeton = 'Aiheeton'
}