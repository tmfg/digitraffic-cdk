// eslint-disable camelcase
import {GeoJsonLineString, GeoJsonPoint} from "digitraffic-common/utils/geojson-types";

export type DbWorkMachine = {
    readonly harjaId: bigint
    readonly harjaUrakkaId: bigint
    readonly type: string
}

export type DbMaintenanceTracking = {
    readonly id?: number|null
    readonly sending_system: string
    readonly sending_time: Date
    readonly last_point: GeoJsonPoint
    line_string: GeoJsonLineString|null
    readonly work_machine_id: number
    start_time: Date
    readonly end_time: Date
    readonly direction?: number
    finished: boolean
    readonly domain: string
    readonly contract: string
    readonly message_original_id: string
    readonly tasks: string[]
    previous_tracking_id?: number|null
    // This is additional meta data, not saved to db, but used to update previous tracking
    start_direction?: number //
}

export type DbLatestTracking = {
    readonly id: number
    readonly last_point: string
    readonly end_time: Date
    readonly finished: boolean
    readonly tasks: string[]
}

export type DbNumberId = {
    readonly id: number
}

export type DbTextId = {
    readonly id: string
}

export type DbDomain = {
    readonly name: string
    readonly source: string
    readonly created?: Date
    readonly modified?: Date
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