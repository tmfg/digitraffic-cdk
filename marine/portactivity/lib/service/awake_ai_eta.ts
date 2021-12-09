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
import moment from 'moment-timezone';

type AwakeAiETAResponseAndShip = {
    readonly response: AwakeAiVoyageResponse
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

        // if less than 24 hours to ship's arrival, set destination LOCODE explicitly
        const diffEtaToNow = moment(ship.eta).diff(moment());
        const diffHours = moment.duration(diffEtaToNow).asHours();
        const locode = diffHours < 24 ? ship.locode : null;

        const response = await retry(() => this.api.getETA(ship.imo, locode), 1);
        return {
            response,
            ship,
            diffHours,
        };
    }

    private toTimeStamps(resp: AwakeAiETAResponseAndShip): ApiTimestamp[] {
        if (!resp.response.schedule) {
            console.warn(`method=toTimeStamps no ETA received, state=${resp.response.type}`);
            return [];
        }
        return this.handleSchedule(resp.response.schedule, resp.ship, resp.diffHours);
    }

    private handleSchedule(schedule: AwakeAiVoyageShipVoyageSchedule, ship: DbETAShip, diffHours: number): ApiTimestamp[] {
        return this.getETAPredictions(schedule).map(etaPrediction => {
            if (!etaPrediction.arrivalTime) {
                console.warn(`method=handleSchedule state=${AwakeDataState.NO_PREDICTED_ETA}`);
                return null;
            }

            if (!AwakeAiETAService.destinationIsFinnish(etaPrediction.locode)) {
                console.warn(`method=handleSchedule state=${AwakeDataState.PREDICTED_DESTINATION_OUTSIDE_FINLAND}`);
                return null;
            }

            let port: string = etaPrediction.locode;
            if (etaPrediction.locode != ship.locode) {
                if (diffHours >= 24) {
                    console.warn(`method=handleSchedule state=${AwakeDataState.DIFFERING_LOCODE} ${etaPrediction.locode} with ${ship.locode}, not persisting`);
                    return null;
                } else if (this.overriddenDestinations.includes(ship.locode)) {
                    console.warn(`method=handleSchedule state=${AwakeDataState.OVERRIDDEN_LOCODE} ${etaPrediction.locode} with ${ship.locode} in override list`);
                    port = ship.locode;
                }
            }

            console.info('method=handleSchedule schedule was valid');

            const timestamp: ApiTimestamp = {
                ship: {
                    mmsi: schedule.ship.mmsi,
                    imo: schedule.ship.imo,
                },
                location: {
                    port,
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

    private static destinationIsFinnish(locode: string): boolean {
        return locode != null && locode.toLowerCase().startsWith('fi');
    }

}
