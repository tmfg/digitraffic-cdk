// eslint-disable camelcase
export type DbWorkMachine = {
    readonly harjaId: bigint
    readonly harjaUrakkaId: bigint
    readonly type: string
}

export type DbMaintenanceTracking = {
    readonly sending_system: string
    readonly sending_time: Date
    readonly last_point: string
    readonly line_string?: string
    readonly work_machine_id: number
    readonly start_time: Date
    readonly end_time: Date
    readonly direction?: number
    readonly finished: boolean
    readonly domain: string
    readonly contract: string
    readonly message_original_id: string
    readonly tasks: string[]
}

export type DbNumberId = {
    readonly id: number
}

export type DbTextId = {
    readonly id: string
}

export type DbDomainContract = {
    readonly domain: string
    readonly contract: string
    readonly name: string
    readonly source?: string,
    readonly start_date?: Date,
    readonly end_date?: Date,
    readonly data_last_updated?: Date,
}

export type DbDomainTaskMapping = {
    readonly name: string
    readonly original_id: string
    readonly domain: string
    readonly ignore: boolean
}