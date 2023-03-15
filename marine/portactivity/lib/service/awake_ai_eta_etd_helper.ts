import {
    AwakeAiPrediction,
    AwakeAiPredictionType,
    AwakeAiShipStatus,
    AwakeAiVoyageEtaPrediction,
    AwakeAiVoyageEtdPrediction,
    AwakeAiZoneType,
    AwakeArrivalPortCallPrediction,
    AwakeURN,
} from "../api/awake_common";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {EventSource} from "../model/eventsource";
import {AwakeAiPortSchedule} from "../api/awake_ai_port";

export enum AwakeDataState {
    OK = "OK",
    SHIP_NOT_UNDER_WAY = "SHIP_NOT_UNDER_WAY",
    WRONG_PREDICTION_TYPE = "WRONG_PREDICTION_TYPE",
    NO_PREDICTED_ETA = "NO_PREDICTED_ETA",
    NO_PREDICTED_ETD = "NO_PREDICTED_ETD",
    NO_RECORD_TIME = "NO_RECORD_TIME",
    NO_PREDICTED_DESTINATION = "NO_PREDICTED_DESTINATION",
    PREDICTED_LOCATION_OUTSIDE_FINLAND = "PREDICTED_LOCATION_OUTSIDE_FINLAND",
    OVERRIDDEN_LOCODE = "OVERRIDDEN_LOCODE",
    DIFFERING_LOCODE = "DIFFERING_LOCODE",
    NO_ETA_TIMESTAMP = "NO_ETA_TIMESTAMP",
}

export function locodeIsFinnish(locode: string | undefined): boolean {
    return locode ? locode.toLowerCase().startsWith("fi") : false;
}

export function isPortcallPrediction(
    prediction: AwakeAiPrediction
): prediction is AwakeArrivalPortCallPrediction {
    return !!prediction && "portCallUrn" in prediction;
}

function portCallIdFromUrn(urn?: AwakeURN<string>): number | null {
    if (!urn) {
        return null;
    }
    const split = urn.split(":");
    if (split.length < 4) {
        throw new Error("Invalid URN: " + urn);
    }
    return Number(split[3]);
}

export function isAwakeEtaPrediction(
    prediction: AwakeAiPrediction
): prediction is AwakeAiVoyageEtaPrediction {
    return prediction.predictionType === AwakeAiPredictionType.ETA;
}

export function isAwakeEtdPrediction(
    prediction: AwakeAiPrediction
): prediction is AwakeAiVoyageEtdPrediction {
    return prediction.predictionType === AwakeAiPredictionType.ETD;
}

export function isDigitrafficEtaPrediction(prediction: AwakeAiPrediction): boolean {
    return (
        prediction.predictionType === AwakeAiPredictionType.ETA &&
        !!prediction.metadata &&
        prediction.metadata.source.includes("digitraffic-portcall")
    );
}

export function isDigitrafficEtdPrediction(prediction: AwakeAiPrediction): boolean {
    return (
        prediction.predictionType === AwakeAiPredictionType.ETD &&
        !!prediction.metadata &&
        prediction.metadata.source.includes("digitraffic-portcall")
    );
}

export function voyageIsNotStopped(schedule: AwakeAiPortSchedule): boolean {
    return schedule.voyage.voyageStatus !== AwakeAiShipStatus.STOPPED
        && (schedule.voyage.voyageStatus === AwakeAiShipStatus.UNDER_WAY || schedule.voyage.voyageStatus === AwakeAiShipStatus.NOT_STARTED)
}

export function etaPredictionToTimestamp(
    prediction: AwakeAiVoyageEtaPrediction,
    source: EventSource,
    locode: string,
    mmsi: number,
    imo: number,
    portArea?: string,
    portcallId?: number,
    portCallPrediction?: AwakeArrivalPortCallPrediction
): ApiTimestamp | null {
    // should always be ETA for ETA predictions but check just in case
    if (prediction.predictionType !== AwakeAiPredictionType.ETA) {
        console.warn(
            "method=AwakeAiPredictionHelper.etaPredictionToTimestamp state=%s, IMO: %d, LOCODE: %s, portcallid: %d",
            AwakeDataState.WRONG_PREDICTION_TYPE,
            imo,
            locode,
            portcallId
        );
        return null;
    }

    if (!prediction.arrivalTime) {
        console.warn(
            "method=AwakeAiPredictionHelper.etaPredictionToTimestamp state=%s, IMO: %d, LOCODE: %s, portcallid: %d",
            AwakeDataState.NO_PREDICTED_ETA,
            imo,
            locode,
            portcallId
        );
        return null;
    }

    if (!locodeIsFinnish(prediction.locode)) {
        console.warn(
            "method=AwakeAiPredictionHelper.etaPredictionToTimestamp state=%s, IMO: %d, LOCODE: %s, portcallid: %d",
            AwakeDataState.PREDICTED_LOCATION_OUTSIDE_FINLAND,
            imo,
            locode,
            portcallId
        );
        return null;
    }

    if (!prediction.recordTime) {
        console.warn(
            "method=AwakeAiPredictionHelper.etaPredictionToTimestamp state=%s, using current time, IMO: %d, LOCODE: %s, portcallid: %d",
            AwakeDataState.NO_RECORD_TIME,
            imo,
            locode,
            portcallId
        );
    }

    console.info(
        "method=AwakeAiPredictionHelper.etaPredictionToTimestamp prediction was valid, IMO: %d, LOCODE: %s, portcallid: %d",
        imo,
        locode,
        portcallId
    );

    const timestamp: ApiTimestamp = {
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
        portcallId:
            portcallId ?? portCallIdFromUrn(portCallPrediction?.portCallUrn),
        eventType:
            prediction.zoneType === AwakeAiZoneType.PILOT_BOARDING_AREA
                ? EventType.ETP
                : EventType.ETA,
    };
    console.info(
        "method=AwakeAiPredictionHelper.etaPredictionToTimestamp created timestamp: %s",
        JSON.stringify(timestamp)
    );
    return timestamp;
}

export function etdPredictionToTimestamp(
    prediction: AwakeAiVoyageEtdPrediction,
    source: EventSource,
    locode: string,
    mmsi: number,
    imo: number,
    portArea?: string,
    portcallId?: number,
    portCallPrediction?: AwakeArrivalPortCallPrediction
): ApiTimestamp | null {
    if (prediction.predictionType !== AwakeAiPredictionType.ETD) {
        console.warn(
            "method=AwakeAiPredictionHelper.etdPredictionToTimestamp state=%s, IMO: %d, LOCODE: %s, portcallid: %d",
            AwakeDataState.WRONG_PREDICTION_TYPE,
            imo,
            locode,
            portcallId
        );
        return null;
    }

    if (!prediction.departureTime) {
        console.warn(
            "method=AwakeAiPredictionHelper.etdPredictionToTimestamp state=%s, IMO: %d, LOCODE: %s, portcallid: %d",
            AwakeDataState.NO_PREDICTED_ETD,
            imo,
            locode,
            portcallId
        );
        return null;
    }

    if (!locodeIsFinnish(prediction.locode)) {
        console.warn(
            "method=AwakeAiPredictionHelper.etdPredictionToTimestamp state=%s, IMO: %d, LOCODE: %s, portcallid: %d",
            AwakeDataState.PREDICTED_LOCATION_OUTSIDE_FINLAND,
            imo,
            locode,
            portcallId
        );
        return null;
    }

    if (!prediction.recordTime) {
        console.warn(
            "method=AwakeAiPredictionHelper.etdPredictionToTimestamp state=%s, using current time, IMO: %d, LOCODE: %s, portcallid: %d",
            AwakeDataState.NO_RECORD_TIME,
            imo,
            locode,
            portcallId
        );
    }

    console.info(
        "method=AwakeAiPredictionHelper.etdPredictionToTimestamp prediction was valid, IMO: %d, LOCODE: %s, portcallid: %d",
        imo,
        locode,
        portcallId
    );

    const timestamp: ApiTimestamp = {
        ship: {
            mmsi,
            imo,
        },
        location: {
            port: locode,
            portArea,
        },
        source,
        eventTime: prediction.departureTime,
        recordTime: prediction.recordTime ?? new Date().toISOString(),
        portcallId:
            portcallId ?? portCallIdFromUrn(portCallPrediction?.portCallUrn),
        eventType: EventType.ETD,
    };
    console.info(
        "method=AwakeAiPredictionHelper.etdPredictionToTimestamp created timestamp: %s",
        JSON.stringify(timestamp)
    );
    return timestamp;
}
