import {
    AwakeAiPredictionType,
    AwakeAiVoyageEtaPrediction,
    AwakeAiZoneType,
    AwakeArrivalPortCallPrediction,
} from "../api/awake_common";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {EventSource} from "../model/eventsource";

export interface UpdateAwakeAiTimestampsSecret {
    readonly "awake.voyagesurl": string
    readonly "awake.voyagesauth": string
}

export enum AwakeDataState {
    OK = "OK",
    SHIP_NOT_UNDER_WAY = "SHIP_NOT_UNDER_WAY",
    WRONG_PREDICTION_TYPE = "WRONG_PREDICTION_TYPE",
    NO_PREDICTED_ETA = "NO_PREDICTED_ETA",
    NO_RECORD_TIME = "NO_RECORD_TIME",
    NO_PREDICTED_DESTINATION = "NO_PREDICTED_DESTINATION",
    PREDICTED_DESTINATION_OUTSIDE_FINLAND = "PREDICTED_DESTINATION_OUTSIDE_FINLAND",
    OVERRIDDEN_LOCODE = "OVERRIDDEN_LOCODE",
    DIFFERING_LOCODE= "DIFFERING_LOCODE",
    NO_ETA_TIMESTAMP = "NO_ETA_TIMESTAMP",
}

export function destinationIsFinnish(locode: string): boolean {
    return locode?.toLowerCase().startsWith("fi");
}

function portCallIdFromUrn(urn?: string): number | null {
    if (!urn) {
        return null;
    }
    const split = urn.split(':');
    if (split.length < 4) {
        throw new Error("Invalid URN: " + urn);
    }
    return Number(split[3]);
}

export function predictionToTimestamp(
    prediction: AwakeAiVoyageEtaPrediction,
    source: EventSource,
    locode: string,
    mmsi: number,
    imo: number,
    portArea?: string,
    portcallId?: number,
    portCallPrediction?: AwakeArrivalPortCallPrediction,
): ApiTimestamp | null {

    // should always be ETA for ETA predictions but check just in case
    if (prediction.predictionType !== AwakeAiPredictionType.ETA) {
        console.warn("method=AwakeAiETAHelper.handleSchedule state=%s, IMO: %d, LOCODE: %s, portcallid: %d", AwakeDataState.WRONG_PREDICTION_TYPE, imo, locode, portcallId);
        return null;
    }

    if (!prediction.arrivalTime) {
        console.warn("method=AwakeAiETAHelper.handleSchedule state=%s, IMO: %d, LOCODE: %s, portcallid: %d", AwakeDataState.NO_PREDICTED_ETA, imo, locode, portcallId);
        return null;
    }

    if (!destinationIsFinnish(prediction.locode)) {
        console.warn("method=AwakeAiETAHelper.predictionToTimestamp state=%s, IMO: %d, LOCODE: %s, portcallid: %d", AwakeDataState.PREDICTED_DESTINATION_OUTSIDE_FINLAND, imo, locode, portcallId);
        return null;
    }

    if (!prediction.recordTime) {
        console.warn("method=AwakeAiETAHelper.handleSchedule state=%s, using current time, IMO: %d, LOCODE: %s, portcallid: %d", AwakeDataState.NO_RECORD_TIME, imo, locode, portcallId);
    }

    console.info("method=AwakeAiETAHelper.predictionToTimestamp prediction was valid, IMO: %d, LOCODE: %s, portcallid: %d", imo, locode, portcallId);

    const timestamp = {
        ship: {
            mmsi,
            imo,
        },
        location: {
            port: locode,
            portArea,
        },
        source,
        eventTime: prediction.arrivalTime,
        recordTime: prediction.recordTime ?? new Date().toISOString(),
        portcallId: portcallId ?? portCallIdFromUrn(portCallPrediction?.portCallUrn),
        eventType: prediction.zoneType === AwakeAiZoneType.PILOT_BOARDING_AREA ? EventType.ETP : EventType.ETA,
    };
    console.info("method=AwakeAiETAHelper.predictionToTimestamp created timestamp: %s", JSON.stringify(timestamp));
    return timestamp;
}
