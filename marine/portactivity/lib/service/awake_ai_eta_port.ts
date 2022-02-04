import {
    AwakeAiShipApiResponse,
    AwakeAiShipPredictability,
    AwakeAiShipVoyageSchedule,
    AwakeAiVoyageEtaPrediction,
} from "../api/awake_ai_ship";
import {DbETAShip} from "../db/timestamps";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {retry} from "digitraffic-common/utils/retry";
import {AwakeAiPredictionType, AwakeAiShipStatus, AwakeAiZoneType} from "../api/awake_common";
import {EventSource} from "../model/eventsource";
import moment from 'moment-timezone';
import {AwakeAiETAPortApi} from "../api/awake_ai_port";
import {predictionToTimestamp} from "./awake_ai_eta_helper";

type AwakeAiETAResponseAndShip = {
    readonly response: AwakeAiShipApiResponse
    readonly ship: DbETAShip
    readonly diffHours: number
}

enum AwakeDataState {
    OK = 'OK',
    SHIP_NOT_UNDER_WAY = 'SHIP_NOT_UNDER_WAY',
    NO_PREDICTED_ETA = 'NO_PREDICTED_ETA',
    NO_PREDICTED_DESTINATION = 'NO_PREDICTED_DESTINATION',
    PREDICTED_DESTINATION_OUTSIDE_FINLAND = 'PREDICTED_DESTINATION_OUTSIDE_FINLAND',
    OVERRIDDEN_LOCODE = 'OVERRIDDEN_LOCODE',
    DIFFERING_LOCODE= 'DIFFERING_LOCODE',
    NO_ETA_TIMESTAMP = 'NO_ETA_TIMESTAMP',
}

export class AwakeAiETAPortService {

    private readonly api: AwakeAiETAPortApi;

    constructor(api: AwakeAiETAPortApi) {
        this.api = api;
    }

    async getAwakeAiTimestamps(locode: string): Promise<ApiTimestamp[]> {
        const resp = await this.api.getETAs(locode);

        if (!resp.schedule) {
            console.warn(`method=AwakeAiETAPortService.toTimeStamps no ETA received, state=${resp.type}`);
            return [];
        }

        return resp.schedule.filter(schedule => schedule.voyage.voyageStatus === AwakeAiShipStatus.UNDER_WAY).flatMap(schedule => {

            const etaPredictions = schedule.voyage.predictions.filter(p => p.predictionType === AwakeAiPredictionType.ETA) as AwakeAiVoyageEtaPrediction[];
            return etaPredictions.map(eta => {
                if (moment(eta.arrivalTime).isAfter(moment().subtract(24, 'hour'))) {
                    console.warn(`method=AwakeAiETAPortService.getAwakeAiTimestamps arrival is closer than 24 hours, not persisting ETA: ${eta}`);
                    return null;
                }

                return predictionToTimestamp(eta,
                    locode,
                    schedule.ship.mmsi,
                    schedule.ship.imo);
            });

        }).filter((ts): ts is ApiTimestamp => ts != null);
    }

}
