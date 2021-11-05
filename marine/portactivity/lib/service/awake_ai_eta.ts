import {AwakeAiETAApi, AwakeAiETA, AwakeAiETAShipStatus, AwakeAiETAResponse} from "../api/awake_ai_eta";
import {DbETAShip} from "../db/timestamps";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {EventSource} from "../model/eventsource";
import {NullablePromiseResult} from "digitraffic-common/promise/promise";

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

    async getAwakeAiTimestamp(ship: DbETAShip): Promise<NullablePromiseResult<ApiTimestamp>> {
        console.info(`method=updateAwakeAiTimestamps fetching ETA for ship with IMO ${ship.imo}`)
        const resp = await this.api.getETA.bind(this.api)(ship.imo);
        return { value: this.toTimeStamp(resp, ship) };
    }

    private toTimeStamp(resp: AwakeAiETAResponse, ship: DbETAShip): ApiTimestamp | null {
        if (!resp.eta) {
            console.warn(`method=updateAwakeAiTimestamps no ETA received, state=${resp.type}`)
            return null;
        }
        return this.handleETA(resp.eta, ship);
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
