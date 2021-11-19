import {
    AwakeAiVoyageEtaPrediction,
    AwakeAiVoyagePredictability,
    AwakeAiVoyagePredictionType,
    AwakeAiVoyageResponse,
    AwakeAiVoyagesApi,
    AwakeAiVoyageShipStatus,
    AwakeAiVoyageShipVoyageSchedule
} from "../api/awake_ai_voyages";
import {DbETAShip} from "../db/timestamps";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {EventSource} from "../model/eventsource";
import {AwakeAiZoneType} from "../api/awake_common";

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
        'FIHKO'
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
                        const ts = this.toTimeStamp(val);
                        return ts ? acc.concat([ts]) : acc;
                    }, []));
    }

    private async getAwakeAiTimestamp(ship: DbETAShip): Promise<AwakeAiETAResponseAndShip> {
        const start = Date.now();
        console.info('method=updateAwakeAiTimestamps fetching ETA for ship with IMO %d tookMs=%d',
            ship.imo,
            (Date.now() - start))
        const response = await this.api.getETA(ship.imo);
        return {
            response,
            ship
        };
    }

    private toTimeStamp(resp: AwakeAiETAResponseAndShip): ApiTimestamp | null {
        if (!resp.response.schedule) {
            console.warn(`method=updateAwakeAiTimestamps no ETA received, state=${resp.response.type}`)
            return null;
        }
        return this.handleSchedule(resp.response.schedule, resp.ship);
    }

    private handleSchedule(schedule: AwakeAiVoyageShipVoyageSchedule, ship: DbETAShip): ApiTimestamp | null {
        const eta = this.getETAPrediction(schedule);

        if (!eta) {
            return null;
        }

        if (eta.locode != ship.locode) {
            if (this.overriddenDestinations.includes(ship.locode)) {
                console.warn(`method=updateAwakeAiTimestamps state=${AwakeDataState.OVERRIDDEN_LOCODE} ${eta.locode} with ${ship.locode} in override list`);
            } else {
                console.warn(`method=updateAwakeAiTimestamps state=${AwakeDataState.DIFFERING_LOCODE} was ${ship.locode}, was ${eta.locode}, saving timestamp with predicted locode`);
            }
        }

        return {
            ship: {
                mmsi: schedule.ship.mmsi,
                imo: schedule.ship.imo
            },
            location: {
                port: this.normalizeDestination(ship.locode,
                    eta.locode as string), // validated to be not null
                portArea: ship.port_area_code
            },
            source: EventSource.AWAKE_AI,
            eventType: EventType.ETA,
            eventTime: eta.arrivalTime, // validated to be not null
            recordTime: eta.recordTime,
            portcallId: ship.portcall_id
        }
    }

    private getETAPrediction(schedule: AwakeAiVoyageShipVoyageSchedule): AwakeAiVoyageEtaPrediction | null {
        if (schedule.predictability !== AwakeAiVoyagePredictability.PREDICTABLE) {
            console.warn(`method=isValidSchedule state=${AwakeDataState.NO_PREDICTED_ETA} voyage was not predictable`);
            return null;
        }

        if (!schedule.predictedVoyages.length) {
            console.warn(`method=isValidSchedule state=${AwakeDataState.NO_PREDICTED_ETA} predicted voyages was empty`);
            return null;
        }

        // we are only interested in the current voyage (ETA) for now
        const eta = schedule.predictedVoyages[0];

        if (eta.voyageStatus !== AwakeAiVoyageShipStatus.UNDER_WAY) {
            console.warn(`method=isValidSchedule state=${AwakeDataState.SHIP_NOT_UNDER_WAY} actual ship status ${eta.voyageStatus} `);
            return null;
        }

        const etaPredictions = eta.predictions.filter(p => p.predictionType == AwakeAiVoyagePredictionType.ETA) as AwakeAiVoyageEtaPrediction[]
        const etaPrediction = etaPredictions.find(p => p.zoneType === AwakeAiZoneType.BERTH);

        if (!etaPrediction) {
            console.warn(`method=isValidSchedule state=${AwakeDataState.NO_PREDICTED_ETA} no prediction of type ETA found`);
            return null;
        }

        if (!etaPrediction.arrivalTime) {
            console.warn(`method=isValidSchedule state=${AwakeDataState.NO_PREDICTED_ETA}`);
            return null;
        }

        if (!AwakeAiETAService.destinationIsFinnish(etaPrediction.locode)) {
            console.warn(`method=isValidSchedule state=${AwakeDataState.PREDICTED_DESTINATION_OUTSIDE_FINLAND}`);
            return null;
        }

        console.info('method=isValidSchedule schedule was valid');

        return etaPrediction;
    }


    private normalizeDestination(expectedDestination: string, predictedDestination: string): string {
        return this.overriddenDestinations.includes(expectedDestination) ? expectedDestination : predictedDestination;
    }

    private static destinationIsFinnish(locode: string): boolean {
        return locode != null && locode.toLowerCase().startsWith('fi');
    }

}
