import {FeatureCollection} from "geojson";

export type ApiContractData = {
    readonly id: string,
    readonly name: string,
    readonly startDate?: string,
    readonly endDate?: string
}

export type ApiRouteData = {
    readonly vehicleType?: string
    readonly user: string,
    geography?: FeatureCollection,
    readonly created?: string,
    readonly updated?: string,
    readonly id: string,
    readonly startTime: string,
    readonly endTime: string,
    readonly operations: string[]
}

export type ApiOperationData = {
    readonly id: string,
    readonly operationName: string
}

