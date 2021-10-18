import axios from 'axios';
import {AxiosError} from 'axios';
import {MediaType} from "digitraffic-common/api/mediatypes";

export enum AwakeAiETAResponseType {
    OK = 'OK',
    SHIP_NOT_FOUND = 'SHIP_NOT_FOUND',
    INVALID_SHIP_ID = 'INVALID_SHIP_ID',
    SERVER_ERROR = 'SERVER_ERROR',
    NO_RESPONSE = 'NO_RESPONSE',
    UNKNOWN = 'UNKNOWN'
}

export type AwakeAiETAResponse = {
    readonly type: AwakeAiETAResponseType
    readonly eta?: AwakeAiETA
}

export enum AwakeAiETAShipStatus {
    UNDER_WAY = 'under_way',
    STOPPED = 'stopped',
    NOT_PREDICTABLE = 'not_predictable',
    VESSEL_DATA_NOT_UPDATED = 'vessel_data_not_updated'
}

export type AwakeAiETA = {
    readonly mmsi: number
    readonly imo?: number
    readonly shipName?: string,
    readonly status: AwakeAiETAShipStatus

    // ISO 8601
    readonly timestamp?: string,

    // locode
    readonly predictedDestination?: string,

    // ISO 8601
    readonly predictedEta?: string,

    // seconds
    readonly predictedTravelTime?: number
}

export class AwakeAiETAApi {

    private readonly url: string
    private readonly apiKey: string

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    async getETA(imo: number): Promise<AwakeAiETAResponse> {
        try {
            const resp = await axios.get(`${this.url}/${imo}`, {
                headers: {
                    'x-awake-access-token': this.apiKey,
                    Accept: MediaType.APPLICATION_JSON
                }
            });
            return {
                type: AwakeAiETAResponseType.OK,
                eta: resp.data
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return AwakeAiETAApi.handleError(error as AxiosError);
            }
            throw error;
        }
    }

    static handleError(error: { response?: { status: number } }): AwakeAiETAResponse {
        if (!error.response) {
            return {
                type: AwakeAiETAResponseType.NO_RESPONSE
            };
        }
        switch (error.response.status) {
            case 404:
                return {
                    type: AwakeAiETAResponseType.SHIP_NOT_FOUND
                }
            case 422:
                return {
                    type: AwakeAiETAResponseType.INVALID_SHIP_ID
                };
            case 500:
                return {
                    type: AwakeAiETAResponseType.SERVER_ERROR
                };
            default:
                return {
                    type: AwakeAiETAResponseType.UNKNOWN
                };
        }
    }
}
