import axios from 'axios';
import {AxiosError} from 'axios';
import {MediaType} from "digitraffic-common/api/mediatypes";
import {AwakeAiZoneType} from "./awake_common";

export enum AwakeAiETAResponseType {
    OK = 'OK',
    SHIP_NOT_FOUND = 'SHIP_NOT_FOUND',
    INVALID_SHIP_ID = 'INVALID_SHIP_ID',
    SERVER_ERROR = 'SERVER_ERROR',
    NO_RESPONSE = 'NO_RESPONSE',
    UNKNOWN = 'UNKNOWN'
}

export type AwakeAiVoyageResponse = {
    readonly type: AwakeAiETAResponseType
    readonly schedule?: AwakeAiVoyageShipVoyageSchedule
}

export enum AwakeAiVoyageShipStatus {
    UNDER_WAY = 'underway',
    STOPPED = 'stopped',
    NOT_PREDICTABLE = 'not_predictable',
    VESSEL_DATA_NOT_UPDATED = 'vessel_data_not_updated'
}

export enum AwakeAiVoyagePredictability {
    PREDICTABLE = 'predictable',
    NOT_PREDICTABLE = 'not-predictable',
    SHIP_DATA_NOT_UPDATED = 'ship-data-not-updated'
}

export enum AwakeAiVoyagePredictionType {
    ETA = 'eta',
    TRAVEL_TIME = 'travel-time',
    DESTINATION = 'destination'
}

export type AwakeAiVoyagePrediction = {

    readonly predictionType: AwakeAiVoyagePredictionType

    // ISO 8601
    readonly recordTime: string

    readonly locode: string

    readonly zoneType: AwakeAiZoneType
}

export type AwakeAiVoyageEtaPrediction = AwakeAiVoyagePrediction & {

    // ISO 8601
    readonly arrivalTime: string
}

export type AwakeAiVoyagePredictedVoyage = {

    readonly voyageStatus: AwakeAiVoyageShipStatus

    /**
     * Voyage sequence number, 0 for current voyage.
     */
    readonly sequenceNo: number

    readonly predictions: AwakeAiVoyagePrediction[]
}

export type AwakeAiVoyageShipVoyageSchedule = {

    readonly ship: {
        readonly mmsi: number
        readonly imo?: number
        readonly shipName?: string,
    }

    readonly predictability: AwakeAiVoyagePredictability

    readonly predictedVoyages: AwakeAiVoyagePredictedVoyage[]
}

export class AwakeAiVoyagesApi {

    private readonly url: string
    private readonly apiKey: string

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    async getETA(imo: number): Promise<AwakeAiVoyageResponse> {
        const start = Date.now();
        try {
            const resp = await axios.get(`${this.url}/${imo}`, {
                headers: {
                    Authorization: this.apiKey,
                    Accept: MediaType.APPLICATION_JSON,
                },
            });
            return {
                type: AwakeAiETAResponseType.OK,
                schedule: resp.data,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return AwakeAiVoyagesApi.handleError(error as AxiosError);
            }
            throw error;
        } finally {
            console.log(`method=getETA tookMs=${Date.now() - start}`);
        }
    }

    static handleError(error: { response?: { status: number } }): AwakeAiVoyageResponse {
        if (!error.response) {
            return {
                type: AwakeAiETAResponseType.NO_RESPONSE,
            };
        }
        switch (error.response.status) {
            case 404:
                return {
                    type: AwakeAiETAResponseType.SHIP_NOT_FOUND,
                };
            case 422:
                return {
                    type: AwakeAiETAResponseType.INVALID_SHIP_ID,
                };
            case 500:
                return {
                    type: AwakeAiETAResponseType.SERVER_ERROR,
                };
            default:
                return {
                    type: AwakeAiETAResponseType.UNKNOWN,
                };
        }
    }
}
