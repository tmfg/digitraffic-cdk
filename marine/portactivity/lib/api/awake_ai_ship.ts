import axios from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { AwakeAiPredictedVoyage, AwakeAiShip } from "./awake_common";

export enum AwakeAiShipResponseType {
    OK = "OK",
    SHIP_NOT_FOUND = "SHIP_NOT_FOUND",
    INVALID_SHIP_ID = "INVALID_SHIP_ID",
    SERVER_ERROR = "SERVER_ERROR",
    NO_RESPONSE = "NO_RESPONSE",
    UNKNOWN = "UNKNOWN",
}

export interface AwakeAiShipApiResponse {
    readonly type: AwakeAiShipResponseType;
    readonly schedule?: AwakeAiShipVoyageSchedule;
}

export enum AwakeAiShipPredictability {
    PREDICTABLE = "predictable",
    NOT_PREDICTABLE = "not-predictable",
    SHIP_DATA_NOT_UPDATED = "ship-data-not-updated",
}

export interface AwakeAiShipVoyageSchedule {
    readonly ship: AwakeAiShip;
    readonly predictability: AwakeAiShipPredictability;
    readonly predictedVoyages: AwakeAiPredictedVoyage[];
}

export class AwakeAiETAShipApi {
    private readonly url: string;
    private readonly apiKey: string;

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    /**
     * Queries the Awake.AI ship ETA API for predictions
     * @param imo Ship IMO
     * @param locode Destination LOCODE. If set, overrides destination prediction.
     */
    async getETA(
        imo: number,
        locode: string | null
    ): Promise<AwakeAiShipApiResponse> {
        const start = Date.now();
        try {
            let url = `${this.url}/ship/${imo}`;
            if (locode) {
                url += `?destination=${locode}`;
            }
            console.info(`AwakeAiETAShipApi.getETA calling URL ${url}`);
            const resp = await axios.get(url, {
                headers: {
                    Authorization: this.apiKey,
                    Accept: MediaType.APPLICATION_JSON,
                },
            });
            return {
                type: AwakeAiShipResponseType.OK,
                schedule: resp.data as unknown as AwakeAiShipVoyageSchedule,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return AwakeAiETAShipApi.handleError(error);
            }
            throw error;
        } finally {
            console.log(
                `method=AwakeAiETAShipApi.getETA tookMs=${Date.now() - start}`
            );
        }
    }

    static handleError(error: {
        response?: { status: number };
    }): AwakeAiShipApiResponse {
        if (!error.response) {
            return {
                type: AwakeAiShipResponseType.NO_RESPONSE,
            };
        }
        switch (error.response.status) {
            case 404:
                return {
                    type: AwakeAiShipResponseType.SHIP_NOT_FOUND,
                };
            case 422:
                return {
                    type: AwakeAiShipResponseType.INVALID_SHIP_ID,
                };
            case 500:
                return {
                    type: AwakeAiShipResponseType.SERVER_ERROR,
                };
            default:
                return {
                    type: AwakeAiShipResponseType.UNKNOWN,
                };
        }
    }
}
