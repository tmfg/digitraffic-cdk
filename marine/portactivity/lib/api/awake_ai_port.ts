import axios from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import {
    AwakeAiPredictedVoyage,
    AwakeAiPredictionType,
    AwakeAiShip,
} from "./awake_common";

export enum AwakeAiPortResponseType {
    OK = "OK",
    PORT_NOT_FOUND = "PORT_NOT_FOUND",
    INVALID_LOCODE = "INVALID_LOCODE",
    SERVER_ERROR = "SERVER_ERROR",
    NO_RESPONSE = "NO_RESPONSE",
    UNKNOWN = "UNKNOWN",
}

export interface AwakeAiPortSchedule {
    readonly ship: AwakeAiShip;
    readonly voyage: AwakeAiPredictedVoyage;
}

export interface AwakeAiPortResponse {
    readonly type: AwakeAiPortResponseType;
    readonly schedule?: AwakeAiPortSchedule[];
}

export class AwakeAiETAPortApi {
    private readonly url: string;
    private readonly apiKey: string;

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    /**
     * Queries the Awake.AI Voyages API for predictions
     * @param locode Destination LOCODE. If set, overrides destination prediction.
     * @param maxSequenceNo Maximum number of preceding stops in multi-hop predictions.
     */
    async getETAs(locode: string, maxSequenceNo: number): Promise<AwakeAiPortResponse> {
        const start = Date.now();
        try {
            const url = `${this.url}/port/${locode}/arrivals?maxSequenceNo=${maxSequenceNo}&predictionType=${AwakeAiPredictionType.ETA}&predictionType=${AwakeAiPredictionType.ARRIVAL_PORT_CALL}`;
            console.info(`AwakeAiETAPortApi.getETAs calling URL ${url}`);
            const resp = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    Accept: MediaType.APPLICATION_JSON,
                },
            });
            return {
                type: AwakeAiPortResponseType.OK,
                schedule: resp.data as unknown as AwakeAiPortSchedule[],
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return AwakeAiETAPortApi.handleError(error);
            }
            throw error;
        } finally {
            console.log(
                `method=AwakeAiETAPortApi.getETAs tookMs=${Date.now() - start}`
            );
        }
    }

    static handleError(error: {
        response?: { status: number };
    }): AwakeAiPortResponse {
        if (!error.response) {
            return {
                type: AwakeAiPortResponseType.NO_RESPONSE,
            };
        }
        switch (error.response.status) {
            case 404:
                return {
                    type: AwakeAiPortResponseType.PORT_NOT_FOUND,
                };
            case 422:
                return {
                    type: AwakeAiPortResponseType.INVALID_LOCODE,
                };
            case 500:
                return {
                    type: AwakeAiPortResponseType.SERVER_ERROR,
                };
            default:
                return {
                    type: AwakeAiPortResponseType.UNKNOWN,
                };
        }
    }
}
