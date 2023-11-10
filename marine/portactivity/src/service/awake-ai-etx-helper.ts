import {
    AwakeAiPrediction,
    AwakeAiPredictionType,
    AwakeAiVoyageEtaPrediction,
    AwakeAiVoyageEtdPrediction,
    AwakeAiVoyageStatus,
    AwakeAiZoneType,
    AwakeArrivalPortCallPrediction,
    AwakeURN,
    digitrafficPortCallString
} from "../api/awake-common";
import { ApiTimestamp, EventType, Location, Ship } from "../model/timestamp";
import type { EventSource } from "../model/eventsource";
import type { AwakeAiPortSchedule } from "../api/awake-ai-port";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

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
    NO_ETA_TIMESTAMP = "NO_ETA_TIMESTAMP"
}

export function locodeIsFinnish(locode: string | undefined): boolean {
    return !!locode && locode.toLowerCase().startsWith("fi");
}

export function isPortcallPrediction(
    prediction: AwakeAiPrediction
): prediction is AwakeArrivalPortCallPrediction {
    return (
        !!prediction &&
        prediction.predictionType === AwakeAiPredictionType.ARRIVAL_PORT_CALL &&
        "portCallUrn" in prediction &&
        (prediction as AwakeArrivalPortCallPrediction).portCallUrn.includes(digitrafficPortCallString)
    );
}

function portCallIdFromUrn(urn?: AwakeURN): number | undefined {
    if (!urn) {
        return undefined;
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
        prediction.metadata.source.includes(digitrafficPortCallString)
    );
}

export function isDigitrafficEtdPrediction(prediction: AwakeAiPrediction): boolean {
    return (
        prediction.predictionType === AwakeAiPredictionType.ETD &&
        !!prediction.metadata &&
        prediction.metadata.source.includes(digitrafficPortCallString)
    );
}

export function voyageUnderwayOrNotStarted(schedule: AwakeAiPortSchedule): boolean {
    return (
        schedule.voyage.voyageStatus === AwakeAiVoyageStatus.UNDER_WAY ||
        schedule.voyage.voyageStatus === AwakeAiVoyageStatus.NOT_STARTED
    );
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
): ApiTimestamp | undefined {
    // should always be ETA for ETA predictions but check just in case
    if (prediction.predictionType !== AwakeAiPredictionType.ETA) {
        logger.warn({
            method: "AwakeAiEtxHelper.etaPredictionToTimestamp",
            message: `state=${
                AwakeDataState.WRONG_PREDICTION_TYPE
            }, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${portcallId ?? "undefined"}`
        });
        return undefined;
    }

    if (!prediction.arrivalTime) {
        logger.warn({
            method: "AwakeAiEtxHelper.etaPredictionToTimestamp",
            message: `state=${AwakeDataState.NO_PREDICTED_ETA}, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${
                portcallId ?? "undefined"
            }`
        });
        return undefined;
    }

    if (!locodeIsFinnish(prediction.locode)) {
        logger.warn({
            method: "AwakeAiEtxHelper.etaPredictionToTimestamp",
            message: `state=${
                AwakeDataState.PREDICTED_LOCATION_OUTSIDE_FINLAND
            }, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${portcallId ?? "undefined"}`
        });
        return undefined;
    }

    if (!prediction.recordTime) {
        logger.warn({
            method: "AwakeAiEtxHelper.etaPredictionToTimestamp",
            message: `state=${
                AwakeDataState.NO_RECORD_TIME
            }, using current time, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${portcallId ?? "undefined"}`
        });
    }

    logger.info({
        method: "AwakeAiEtxHelper.etaPredictionToTimestamp",
        message: `prediction was valid, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${
            portcallId ?? "undefined"
        }`
    });

    const timestamp = createApiTimestamp(
        { mmsi, imo },
        { port: locode, portArea },
        prediction,
        prediction.arrivalTime,
        prediction.zoneType === AwakeAiZoneType.PILOT_BOARDING_AREA ? EventType.ETP : EventType.ETA,
        source,
        portcallId ?? portCallIdFromUrn(portCallPrediction?.portCallUrn)
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
): ApiTimestamp | undefined {
    if (prediction.predictionType !== AwakeAiPredictionType.ETD) {
        logger.warn({
            method: "AwakeAiEtxHelper.etdPredictionToTimestamp",
            message: `state=${
                AwakeDataState.WRONG_PREDICTION_TYPE
            }, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${portcallId ?? "undefined"}`
        });
        return undefined;
    }

    if (!prediction.departureTime) {
        logger.warn({
            method: "AwakeAiEtxHelper.etdPredictionToTimestamp",
            message: `state=${AwakeDataState.NO_PREDICTED_ETD}, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${
                portcallId ?? "undefined"
            }`
        });
        return undefined;
    }

    if (!locodeIsFinnish(prediction.locode)) {
        logger.warn({
            method: "AwakeAiEtxHelper.etdPredictionToTimestamp",
            message: `state=${
                AwakeDataState.PREDICTED_LOCATION_OUTSIDE_FINLAND
            }, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${portcallId ?? "undefined"}`
        });
        return undefined;
    }

    if (!prediction.recordTime) {
        logger.warn({
            method: "AwakeAiEtxHelper.etdPredictionToTimestamp",
            message: `state=${
                AwakeDataState.NO_RECORD_TIME
            }, using current time, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${portcallId ?? "undefined"}`
        });
    }

    logger.info({
        method: "AwakeAiEtxHelper.etdPredictionToTimestamp",
        message: `prediction was valid, IMO: ${imo}, LOCODE: ${locode}, portcallid: ${
            portcallId ?? "undefined"
        }`
    });

    const timestamp = createApiTimestamp(
        { mmsi, imo },
        { port: locode, portArea },
        prediction,
        prediction.departureTime,
        EventType.ETD,
        source,
        portcallId ?? portCallIdFromUrn(portCallPrediction?.portCallUrn)
    );
    return timestamp;
}

function createApiTimestamp(
    ship: Ship,
    location: Location,
    prediction: AwakeAiVoyageEtaPrediction | AwakeAiVoyageEtdPrediction,
    eventTime: string,
    eventType: EventType,
    source: string,
    portcallId?: number
): ApiTimestamp {
    return {
        ship,
        location,
        source,
        eventTime,
        recordTime: prediction.recordTime ?? new Date().toISOString(),
        portcallId,
        eventType,
        eventTimeConfidenceLowerDiff: prediction.metadata?.errorQuantiles?.q10,
        eventTimeConfidenceUpperDiff: prediction.metadata?.errorQuantiles?.q90
    };
}
