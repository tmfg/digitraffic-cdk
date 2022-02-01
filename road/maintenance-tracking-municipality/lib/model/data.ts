import {FeatureCollection} from "geojson";

export type ApiContractData = {
    readonly id: string,
    readonly name: string,
    readonly startDate?: Date,
    readonly endDate?: Date
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

