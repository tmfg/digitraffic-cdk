import {FeatureCollection} from "geojson";

export type ApiContractData = {
    readonly id: string,
    readonly name: string,
    readonly startDate: Date,
    readonly endDate: Date
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
    readonly sendingSystem : string
    readonly sendingTime: Date
    readonly lastPoint: string
    readonly lineString: string | undefined
    readonly workMachineId: number
    readonly startTime: Date
    readonly endTime: Date
    readonly direction: number | undefined
    readonly finished: boolean
    readonly domain: string
    readonly contract: string
    readonly municipalityMessageOriginalId: string
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
    readonly start_date: Date,
    readonly end_date: Date,
    readonly data_last_updated: Date | undefined,
}

export type DbDomainTaskMapping = {
    readonly name: string
    readonly original_id : string
    readonly domain: string
    readonly ignore: boolean
}