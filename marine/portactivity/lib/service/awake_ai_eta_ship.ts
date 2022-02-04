import {
    AwakeAiETAShipApi,
    AwakeAiShipApiResponse,
    AwakeAiShipPredictability,
    AwakeAiShipVoyageSchedule,
    AwakeAiVoyageEtaPrediction,
} from "../api/awake_ai_ship";
import {DbETAShip} from "../db/timestamps";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {retry} from "digitraffic-common/utils/retry";
import {AwakeAiPredictionType, AwakeAiShipStatus, AwakeAiZoneType} from "../api/awake_common";
import moment from 'moment-timezone';
import {AwakeDataState, predictionToTimestamp} from "./awake_ai_eta_helper";

type AwakeAiETAResponseAndShip = {
    readonly response: AwakeAiShipApiResponse
    readonly ship: DbETAShip
    readonly diffHours: number
}

export class AwakeAiETAShipService {

    private readonly api: AwakeAiETAShipApi;

    readonly overriddenDestinations = [
        'FIHEL',
        'FIPOR',
        'FIHKO',
    ];

    readonly publishAsETBDestinations = [
        'FIRAU',
    ];

    constructor(api: AwakeAiETAShipApi) {
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
                    console.info(`method=AwakeAiETAShipService.getAwakeAiTimestamps Received ETA response: ${JSON.stringify(val)}`);
                    const timestamps = this.toTimeStamps(val);

                    // temporarily publish ETA also as ETB
                    const etbs = timestamps
                        .filter(ts => this.publishAsETBDestinations.includes(ts.location.port))
                        .filter(ts => ts.eventType === EventType.ETA)
                        .map(ts => ({...ts, ...{eventType: EventType.ETB}}));

                    return acc.concat(timestamps, etbs);
                }, []));
    }

    private async getAwakeAiTimestamp(ship: DbETAShip): Promise<AwakeAiETAResponseAndShip> {
        const start = Date.now();

        // if less than 24 hours to ship's arrival, set destination LOCODE explicitly
        const diffEtaToNow = moment(ship.eta).diff(moment());
        const diffHours = moment.duration(diffEtaToNow).asHours();
        const locode = diffHours < 24 ? ship.locode : null;

        const response = await retry(() => this.api.getETA(ship.imo, locode), 1);

        console.info(`method=AwakeAiETAShipService.getAwakeAiTimestamp fetched ETA for ship with IMO: ${ship.imo}, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}, tookMs=${(Date.now() - start)}`);
        return {
            response,
            ship,
            diffHours,
        };
    }

    private toTimeStamps(resp: AwakeAiETAResponseAndShip): ApiTimestamp[] {
        if (!resp.response.schedule) {
            console.warn(`method=AwakeAiETAShipService.toTimeStamps no ETA received, state=${resp.response.type}`);
            return [];
        }
        return this.handleSchedule(resp.response.schedule, resp.ship, resp.diffHours);
    }

    private handleSchedule(schedule: AwakeAiShipVoyageSchedule, ship: DbETAShip, diffHours: number): ApiTimestamp[] {
        return this.getETAPredictions(schedule).map(etaPrediction => {

            let port: string = etaPrediction.locode;
            if (etaPrediction.locode != ship.locode) {
                if (diffHours >= 24) {
                    console.warn(`method=AwakeAiETAShipService.handleSchedule state=${AwakeDataState.DIFFERING_LOCODE} not persisting, IMO: ${ship.imo}, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}`);
                    return null;
                } else if (this.overriddenDestinations.includes(ship.locode)) {
                    console.warn(`method=AwakeAiETAShipService.handleSchedule state=${AwakeDataState.OVERRIDDEN_LOCODE} LOCODE in override list, IMO: ${ship.imo}, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}`);
                    port = ship.locode;
                }
            }

            if (etaPrediction.zoneType === AwakeAiZoneType.PILOT_BOARDING_AREA && !this.publishAsETBDestinations.includes(port)) {
                console.warn(`method=AwakeAiETAShipService.handleSchedule ETP event for non-publishable LOCODE, IMO: ${ship.imo}, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}`);
                return null;
            }

            return predictionToTimestamp(
                etaPrediction,
                ship.locode,
                schedule.ship.mmsi,
                ship.imo,
                ship.port_area_code,
                ship.portcall_id,
            );
        }).filter((ts): ts is ApiTimestamp => ts != null);
    }

    private getETAPredictions(schedule: AwakeAiShipVoyageSchedule): AwakeAiVoyageEtaPrediction[] {
        if (schedule.predictability !== AwakeAiShipPredictability.PREDICTABLE) {
            console.warn(`method=AwakeAiETAShipService.getETAPredictions state=${AwakeDataState.NO_PREDICTED_ETA} voyage was not predictable, schedule ${JSON.stringify(schedule)}`);
            return [];
        }

        if (!schedule.predictedVoyages.length) {
            console.warn(`method=AwakeAiETAShipService.getETAPredictions state=${AwakeDataState.NO_PREDICTED_ETA} predicted voyages was empty, schedule ${JSON.stringify(schedule)}`);
            return [];
        }

        // we are only interested in the current voyage (ETA) for now
        const eta = schedule.predictedVoyages[0];

        if (eta.voyageStatus !== AwakeAiShipStatus.UNDER_WAY) {
            console.warn(`method=AwakeAiETAShipService.getETAPredictions state=${AwakeDataState.SHIP_NOT_UNDER_WAY} actual ship status ${eta.voyageStatus}, schedule ${JSON.stringify(schedule)}`);
            return [];
        }

        return eta.predictions.filter(p => p.predictionType === AwakeAiPredictionType.ETA) as AwakeAiVoyageEtaPrediction[];
    }

}
