// eslint-disable camelcase
import {GeoJsonLineString, GeoJsonPoint} from "digitraffic-common/utils/geometry";

export type DbWorkMachine = {
    readonly harjaId: bigint
    readonly harjaUrakkaId: bigint
    readonly type: string
}

export type DbMaintenanceTracking = {
    readonly sending_system: string
    readonly sending_time: Date
    readonly last_point: GeoJsonPoint
    line_string: GeoJsonLineString|null
    readonly work_machine_id: bigint
    start_time: Date
    readonly end_time: Date
    readonly direction?: number
    finished: boolean
    readonly domain: string
    readonly contract: string
    readonly message_original_id: string
    readonly tasks: string[]
    previous_tracking_id?: bigint|null
}

export type DbLatestTracking = {
    readonly id: bigint
    readonly last_point: string
    readonly end_time: Date
    readonly finished: boolean
    readonly tasks: string[]
}

export type DbNumberId = {
    readonly id: bigint
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