import { randomString } from "@digitraffic/common/dist/test/testutils";
import { Feature, Geometry } from "geojson";
import moment from "moment";
import {
    ApiContractData,
    ApiOperationData,
    ApiRouteData,
} from "../lib/model/autori-api-data";
import {
    AUTORI_OPERATION_BRUSHING,
    AUTORI_OPERATION_PAVING,
    AUTORI_OPERATION_SALTING,
    VEHICLE_TYPE,
} from "./testconstants";

/**
 *
 * @param updated creates start time -6 min and end time -1 min of this
 * @param geometries
 * @param operations
 */
export function createApiRouteData(
    updated: Date,
    geometries: Geometry[],
    operations: string[] = [
        AUTORI_OPERATION_BRUSHING,
        AUTORI_OPERATION_PAVING,
        AUTORI_OPERATION_SALTING,
    ]
): ApiRouteData {
    const features: Feature[] = createApiRoutedataFeatures(geometries);
    return {
        vehicleType: VEHICLE_TYPE,
        user: VEHICLE_TYPE,
        geography: {
            features: features,
            type: "FeatureCollection",
        },
        created: new Date().toISOString(),
        updated: updated.toISOString(),
        id: randomString(),
        startTime:
            createTrackingStartTimeFromUpdatedTime(updated).toISOString(),
        endTime: createTrackingEndTimeFromUpdatedTime(updated).toISOString(),
        operations: operations,
    };
}

export function createTrackingStartTimeFromUpdatedTime(
    updatedTime: Date
): Date {
    return moment(updatedTime).subtract(5, "minutes").toDate();
}

export function createTrackingEndTimeFromUpdatedTime(updatedTime: Date): Date {
    return moment(updatedTime).subtract(1, "minutes").toDate();
}

export function createApiRoutedataFeatures(geometries: Geometry[]): Feature[] {
    return Array.from({ length: geometries.length }, (_, i) => {
        return {
            type: "Feature",
            geometry: geometries[i],
            properties: {
                streetAddress: "Patukatu 1-10, Oulu",
                featureType: "StreetAddress",
            },
        };
    });
}

export function createApiOperationData(
    id: string,
    operationName: string
): ApiOperationData {
    return {
        id: id,
        operationName: operationName,
    };
}

export function createApiContractData(
    name: string,
    endDate = moment().add(30, "days").toDate()
): ApiContractData {
    return {
        id: randomString(),
        name: name,
        startDate: moment().subtract(30, "days").toISOString(),
        endDate: endDate.toISOString(),
    };
}
