import {
    AwakeAiVoyageEtaPrediction,
    AwakeAiVoyagePredictability,
    AwakeAiVoyagePredictionType,
    AwakeAiVoyageResponse,
    AwakeAiVoyagesApi,
    AwakeAiVoyageShipStatus,
    AwakeAiVoyageShipVoyageSchedule,
} from "../api/awake_ai_voyages";
import {DbETAShip} from "../db/timestamps";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {retry} from "digitraffic-common/promise/promise";
import {AwakeAiZoneType} from "../api/awake_common";
import {EventSource} from "../model/eventsource";

type AwakeAiETAResponseAndShip = {
    readonly response: AwakeAiVoyageResponse
    readonly ship: DbETAShip
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

export class AwakeAiETAService {

    private readonly api: AwakeAiVoyagesApi

    readonly overriddenDestinations = [
        'FIHEL',
        'FIPOR',
        'FIHKO',
    ];

    constructor(api: AwakeAiVoyagesApi) {
        this.api = api;
    }

    getAwakeAiTimestamps(ships: DbETAShip[]): Promise<ApiTimestamp[]> {
        return Promise.allSettled(ships.map(this.getAwakeAiTimestamp.bind(this)))
            .then(responses =>
                responses
                    .reduce<Array<ApiTimestamp>>((acc, result) => {
                    const val = result.status === 'fulfilled' ? result.value : null;
                    if (!val) {
                        return acc;
                    }
                    const timestamps = this.toTimeStamps(val);

                    // temporarily publish ETA also as ETB
                    const etbs = timestamps
                        .filter(ts => ts.eventType === EventType.ETA)
                        .map(ts => ({...ts, ...{eventType: EventType.ETB}}));

                    return acc.concat(timestamps, etbs);
                }, []));
    }

    private async getAwakeAiTimestamp(ship: DbETAShip): Promise<AwakeAiETAResponseAndShip> {
        const start = Date.now();
        console.info('method=getAwakeAiTimestamp fetching ETA for ship with IMO %d tookMs=%d',
            ship.imo,
            (Date.now() - start));
        const response = await retry(() => this.api.getETA(ship.imo), 1);
        return {
            response,
            ship,
        };
    }

    private toTimeStamps(resp: AwakeAiETAResponseAndShip): ApiTimestamp[] {
        if (!resp.response.schedule) {
            console.warn(`method=toTimeStamps no ETA received, state=${resp.response.type}`);
            return [];
        }
        return this.handleSchedule(resp.response.schedule, resp.ship);
    }

    private handleSchedule(schedule: AwakeAiVoyageShipVoyageSchedule, ship: DbETAShip): ApiTimestamp[] {
        return this.getETAPredictions(schedule).map(etaPrediction => {
            if (!etaPrediction.arrivalTime) {
                console.warn(`method=handleSchedule state=${AwakeDataState.NO_PREDICTED_ETA}`);
                return null;
            }

            if (!AwakeAiETAService.destinationIsFinnish(etaPrediction.locode)) {
                console.warn(`method=handleSchedule state=${AwakeDataState.PREDICTED_DESTINATION_OUTSIDE_FINLAND}`);
                return null;
            }

            if (etaPrediction.locode != ship.locode) {
                if (this.overriddenDestinations.includes(ship.locode)) {
                    console.warn(`method=handleSchedule state=${AwakeDataState.OVERRIDDEN_LOCODE} ${etaPrediction.locode} with ${ship.locode} in override list`);
                } else {
                    console.warn(`method=handleSchedule state=${AwakeDataState.DIFFERING_LOCODE} was ${ship.locode}, was ${etaPrediction.locode}, saving timestamp with predicted locode`);
                }
            }

            console.info('method=handleSchedule schedule was valid');

            const timestamp: ApiTimestamp = {
                ship: {
                    mmsi: schedule.ship.mmsi,
                    imo: schedule.ship.imo,
                },
                location: {
                    port: this.normalizeDestination(ship.locode,
                        etaPrediction.locode as string), // validated to be not null
                    portArea: ship.port_area_code,
                },
                source: EventSource.AWAKE_AI,
                eventTime: etaPrediction.arrivalTime, // validated to be not null
                recordTime: etaPrediction.recordTime,
                portcallId: ship.portcall_id,
                eventType: etaPrediction.zoneType === AwakeAiZoneType.PILOT_BOARDING_AREA ? EventType.ETP : EventType.ETA,
            };
            return timestamp;
        }).filter((ts): ts is ApiTimestamp => ts != null);
    }

    private getETAPredictions(schedule: AwakeAiVoyageShipVoyageSchedule): AwakeAiVoyageEtaPrediction[] {
        if (schedule.predictability !== AwakeAiVoyagePredictability.PREDICTABLE) {
            console.warn(`method=getETAPredictions state=${AwakeDataState.NO_PREDICTED_ETA} voyage was not predictable`);
            return [];
        }

        if (!schedule.predictedVoyages.length) {
            console.warn(`method=getETAPredictions state=${AwakeDataState.NO_PREDICTED_ETA} predicted voyages was empty`);
            return [];
        }

        // we are only interested in the current voyage (ETA) for now
        const eta = schedule.predictedVoyages[0];

        if (eta.voyageStatus !== AwakeAiVoyageShipStatus.UNDER_WAY) {
            console.warn(`method=getETAPredictions state=${AwakeDataState.SHIP_NOT_UNDER_WAY} actual ship status ${eta.voyageStatus} `);
            return [];
        }

        return eta.predictions.filter(p => p.predictionType === AwakeAiVoyagePredictionType.ETA) as AwakeAiVoyageEtaPrediction[];
    }


    private normalizeDestination(expectedDestination: string, predictedDestination: string): string {
        return this.overriddenDestinations.includes(expectedDestination) ? expectedDestination : predictedDestination;
    }

    private static destinationIsFinnish(locode: string): boolean {
        return locode != null && locode.toLowerCase().startsWith('fi');
    }

}
