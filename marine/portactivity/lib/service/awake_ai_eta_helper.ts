import {AwakeAiZoneType} from "../api/awake_common";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {EventSource} from "../model/eventsource";
import {AwakeAiVoyageEtaPrediction} from "../api/awake_ai_ship";

export enum AwakeDataState {
    OK = 'OK',
    SHIP_NOT_UNDER_WAY = 'SHIP_NOT_UNDER_WAY',
    NO_PREDICTED_ETA = 'NO_PREDICTED_ETA',
    NO_PREDICTED_DESTINATION = 'NO_PREDICTED_DESTINATION',
    PREDICTED_DESTINATION_OUTSIDE_FINLAND = 'PREDICTED_DESTINATION_OUTSIDE_FINLAND',
    OVERRIDDEN_LOCODE = 'OVERRIDDEN_LOCODE',
    DIFFERING_LOCODE= 'DIFFERING_LOCODE',
    NO_ETA_TIMESTAMP = 'NO_ETA_TIMESTAMP',
}

function destinationIsFinnish(locode: string): boolean {
    return locode != null && locode.toLowerCase().startsWith('fi');
}

export function predictionToTimestamp(
    prediction: AwakeAiVoyageEtaPrediction,
    locode: string,
    mmsi: number,
    imo: number,
    portArea?: string,
    portcallId?: number,
): ApiTimestamp | null {

    if (!prediction.arrivalTime) {
        console.warn(`method=AwakeAiETAHelper.predictionToTimestamp state=${AwakeDataState.NO_PREDICTED_ETA}`);
        return null;
    }

    if (!destinationIsFinnish(prediction.locode)) {
        console.warn(`method=AwakeAiETAHelper.predictionToTimestamp state=${AwakeDataState.PREDICTED_DESTINATION_OUTSIDE_FINLAND}`);
        return null;
    }

    console.info('method=AwakeAiETAHelper.predictionToTimestamp schedule was valid');

    return {
        ship: {
            mmsi,
            imo,
        },
        location: {
            port: locode,
            portArea,
        },
        source: EventSource.AWAKE_AI,
        eventTime: prediction.arrivalTime,
        recordTime: prediction.recordTime,
        portcallId,
        eventType: prediction.zoneType === AwakeAiZoneType.PILOT_BOARDING_AREA ? EventType.ETP : EventType.ETA,
    };
}
