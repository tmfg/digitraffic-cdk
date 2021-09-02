import axios from 'axios';
import {AxiosError} from 'axios';
import {MediaType} from "digitraffic-common/api/mediatypes";

export enum AwakeAiResponseType {
    OK = 'OK',
    SHIP_NOT_FOUND = 'SHIP_NOT_FOUND',
    INVALID_SHIP_ID = 'INVALID_SHIP_ID',
    SERVER_ERROR = 'SERVER_ERROR',
    NO_RESPONSE = 'NO_RESPONSE',
    UNKNOWN = 'UNKNOWN'
}

export type AwakeAiResponse = {
    readonly type: AwakeAiResponseType
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

export class AwakeAiApi {

    private readonly url: string
    private readonly apiKey: string

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    async getETA(imo: number): Promise<AwakeAiResponse> {
        try {
            const resp = await axios.get(`${this.url}/${imo}`, {
                headers: {
                    'x-awake-access-token': this.apiKey,
                    Accept: MediaType.APPLICATION_JSON
                }
            });
            return {
                type: AwakeAiResponseType.OK,
                eta: resp.data
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return this.handleAxiosError(error as AxiosError);
            }
            throw error;
        }
    }

    handleAxiosError(error: AxiosError): AwakeAiResponse {
        if (!error.response) {
            return {
                type: AwakeAiResponseType.NO_RESPONSE
            };
        }
        switch (error.response.status) {
            case 404:
                return {
                    type: AwakeAiResponseType.SHIP_NOT_FOUND
                }
            case 422:
                return {
                    type: AwakeAiResponseType.INVALID_SHIP_ID
                };
            case 500:
                return {
                    type: AwakeAiResponseType.SERVER_ERROR
                };
            default:
                return {
                    type: AwakeAiResponseType.UNKNOWN
                };
        }
    }
}
