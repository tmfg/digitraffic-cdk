export interface Fault {
    id: string,
    fault_entry_timestamp: Date,
    fault_fixed_timestamp: Date,
    fault_state: string,
    fault_type: string,
    geometry: any
}