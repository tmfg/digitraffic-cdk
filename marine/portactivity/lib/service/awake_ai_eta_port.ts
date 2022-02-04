import {ApiTimestamp} from "../model/timestamp";
import {AwakeAiPredictionType, AwakeAiShipStatus, AwakeAiVoyageEtaPrediction} from "../api/awake_common";
import moment from 'moment-timezone';
import {AwakeAiETAPortApi} from "../api/awake_ai_port";
import {predictionToTimestamp} from "./awake_ai_eta_helper";
import {EventSource} from "../model/eventsource";

export class AwakeAiETAPortService {

    private readonly api: AwakeAiETAPortApi;

    constructor(api: AwakeAiETAPortApi) {
        this.api = api;
    }

    async getAwakeAiTimestamps(locode: string): Promise<ApiTimestamp[]> {
        const resp = await this.api.getETAs(locode);

        console.info(`method=AwakeAiETAPortService.getAwakeAiTimestamps Received ETA response: ${JSON.stringify(resp)}`);

        if (!resp.schedule) {
            console.warn(`method=AwakeAiETAPortService.getAwakeAiTimestamps no ETA received, state=${resp.type}`);
            return [];
        }

        return resp.schedule.filter(schedule => schedule.voyage.voyageStatus === AwakeAiShipStatus.UNDER_WAY).flatMap(schedule => {

            const etaPredictions = schedule.voyage.predictions.filter(p => p.predictionType === AwakeAiPredictionType.ETA) as AwakeAiVoyageEtaPrediction[];
            return etaPredictions.map(eta => {
                if (moment(eta.arrivalTime).isAfter(moment().subtract(24, 'hour'))) {
                    console.warn(`method=AwakeAiETAPortService.getAwakeAiTimestamps arrival is closer than 24 hours, not persisting ETA: ${JSON.stringify(eta)}`);
                    return null;
                }

                return predictionToTimestamp(
                    eta,
                    EventSource.AWAKE_AI_PRED,
                    locode,
                    schedule.ship.mmsi,
                    schedule.ship.imo,
                );
            });

        }).filter((ts): ts is ApiTimestamp => ts != null);
    }

}
