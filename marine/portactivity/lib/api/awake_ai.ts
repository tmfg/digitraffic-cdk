import axios from 'axios';
import {MediaType} from "digitraffic-common/api/mediatypes";

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

/*
    Return codes:
    200 - Ok
    404 - Ship not found
    422 - Invalid ship id
 */
export class AwakeAiApi {

    private readonly url: string
    private readonly apiKey: string

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    async getETA(imo: number): Promise<AwakeAiETA> {
        const resp = await axios.get(`${this.url}/${imo}`, {
            headers: {
                'x-awake-access-token': this.apiKey,
                Accept: MediaType.APPLICATION_JSON
            }
        });
        return resp.data as AwakeAiETA;
    }
}
