export interface Fault {
    properties: {
        ID: string,
        FAULT_ENTRY_TIMESTAMP: string,
        FAULT_FIXED_TIMESTAMP: string,
        FAULT_STATE: string,
        FAULT_TYPE: string,
        FIXED: boolean
    }
    geometry: any
}