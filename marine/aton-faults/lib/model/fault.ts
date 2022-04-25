export interface DbFault {
    readonly id: number
    readonly entry_timestamp: Date
    readonly fixed_timestamp: Date | null
    readonly aton_fault_type: string
    readonly domain: string
    readonly state: FaultState
    readonly fixed: boolean
    readonly aton_id: number
    readonly aton_name_fi: string
    readonly aton_name_sv: string
    readonly aton_type: string
    readonly fairway_number: number
    readonly fairway_name_fi: string
    readonly fairway_name_sv: string
    readonly area_number: number
    readonly area_description: string
    readonly geometry: string
}

export enum FaultState {
    Avoin = 'Avoin',
    Kirjattu = 'Kirjattu',
    Peruttu = 'Peruttu',
    Korjattu = 'Korjattu',
    Aiheeton = 'Aiheeton'
}
