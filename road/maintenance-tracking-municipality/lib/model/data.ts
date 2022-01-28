import {FeatureCollection} from "geojson";

export type ApiContractData = {
    readonly id: string,
    readonly name: string,
    readonly startDate: Date | undefined,
    readonly endDate: Date | undefined
}

export type ApiRouteData = {
    readonly vehicleType: string
    readonly geography: FeatureCollection, // FeatureCollection // optional
    readonly created: Date, // optional
    readonly updated: Date, // optional
    readonly id: string,
    readonly startTime: Date,
    readonly endTime: Date,
    readonly operations: string[]
}

export type ApiOperationData = {
    readonly id: string,
    readonly operationName: string
}

export type DbWorkMachine = {
    readonly harjaId: bigint
    readonly harjaUrakkaId: bigint
    readonly type: string
}

export type DbMaintenanceTracking = {
    readonly sending_system : string
    readonly sending_time: Date
    readonly last_point: string
    readonly line_string: string | undefined
    readonly work_machine_id: number
    readonly start_time: Date
    readonly end_time: Date
    readonly direction: number | undefined
    readonly finished: boolean
    readonly domain: string
    readonly contract: string
    readonly message_original_id: string
    readonly tasks: string[]
}

export type DbNumberId = {
    readonly id : number
}

export type DbTextId = {
    readonly id : string
}

export type DbDomainContract = {
    readonly domain : string
    readonly contract: string
    readonly name: string
    readonly source: string | undefined,
    readonly start_date: Date | undefined,
    readonly end_date: Date | undefined,
    readonly data_last_updated: Date | undefined,
}

export type DbDomainTaskMapping = {
    readonly name: string
    readonly original_id : string
    readonly domain: string
    readonly ignore: boolean
}