import {AwakeAiETAApi, AwakeAiETA, AwakeAiETAShipStatus, AwakeAiETAResponse} from "../api/awake_ai_eta";
import {DbETAShip} from "../db/timestamps";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {EventSource} from "../model/eventsource";

type AwakeAiETAResponseAndShip = {
    readonly response: AwakeAiETAResponse
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

    private readonly api: AwakeAiETAApi

    readonly overriddenDestinations = [
        'FIHEL',
        'FIPOR',
        'FIHKO'
    ];

    constructor(api: AwakeAiETAApi) {
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
        if (!resp.response.eta) {
            console.warn(`method=updateAwakeAiTimestamps no ETA received, state=${resp.response.type}`)
            return null;
        }
        return this.handleETA(resp.response.eta, resp.ship);
    }

    private handleETA(eta: AwakeAiETA, ship: DbETAShip): ApiTimestamp | null {
        if (!this.isValidETA(eta)) {
            return null;
        }

        if (eta.predictedDestination != ship.locode) {
            if (this.overriddenDestinations.includes(ship.locode)) {
                console.warn(`method=updateAwakeAiTimestamps state=${AwakeDataState.OVERRIDDEN_LOCODE} ${eta.predictedDestination} with ${ship.locode} in override list`);
            } else {
                console.warn(`method=updateAwakeAiTimestamps state=${AwakeDataState.DIFFERING_LOCODE} was ${ship.locode}, was ${eta.predictedDestination}, saving timestamp with predicted locode`);
            }
        }

        if (!eta.timestamp) {
            console.warn(`method=updateAwakeAiTimestamps state=${AwakeDataState.NO_ETA_TIMESTAMP} using current time`);
        }

        return {
            ship: {
                mmsi: eta.mmsi,
                imo: eta.imo
            },
            location: {
                port: this.normalizeDestination(ship.locode,
                    eta.predictedDestination!), // validated to be not null
                portArea: ship.port_area_code
            },
            source: EventSource.AWAKE_AI,
            eventType: EventType.ETA,
            eventTime: eta.predictedEta!, // validated to be not null
            recordTime: eta.timestamp ?? new Date().toISOString(),
            portcallId: ship.portcall_id
        }
    }

    private isValidETA(eta: AwakeAiETA): boolean {
        if (eta.status != AwakeAiETAShipStatus.UNDER_WAY) {
            console.warn(`method=updateAwakeAiTimestamps state=${AwakeDataState.SHIP_NOT_UNDER_WAY} actual ship status ${eta.status} `);
            return false;
        }

        if (!eta.predictedEta) {
            console.warn(`method=updateAwakeAiTimestamps state=${AwakeDataState.NO_PREDICTED_ETA}`);
            return false;
        }

        if (!eta.predictedDestination) {
            console.warn(`method=updateAwakeAiTimestamps state=${AwakeDataState.NO_PREDICTED_DESTINATION}`);
            return false;
        }

        if (!this.destinationIsFinnish(eta.predictedDestination)) {
            console.warn(`method=updateAwakeAiTimestamps state=${AwakeDataState.PREDICTED_DESTINATION_OUTSIDE_FINLAND}`);
            return false;
        }

        return true;
    }


    private normalizeDestination(expectedDestination: string, predictedDestination: string): string {
        return this.overriddenDestinations.includes(expectedDestination) ? expectedDestination : predictedDestination;
    }

    private destinationIsFinnish(locode: string): boolean {
        return locode.toLowerCase().startsWith('fi');
    }

}
