import axios from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { AwakeAiPredictedVoyage, AwakeAiPredictionType, AwakeAiShip } from "./awake_common";

export enum AwakeAiPortResponseType {
    OK = "OK",
    PORT_NOT_FOUND = "PORT_NOT_FOUND",
    INVALID_LOCODE = "INVALID_LOCODE",
    SERVER_ERROR = "SERVER_ERROR",
    NO_RESPONSE = "NO_RESPONSE",
    UNKNOWN = "UNKNOWN"
}

export enum AwakeAiPortResource {
    ARRIVALS = "arrivals",
    DEPARTURES = "departures"
}

export interface AwakeAiPortSchedule {
    readonly ship: AwakeAiShip;
    readonly voyage: AwakeAiPredictedVoyage;
}

export interface AwakeAiPortResponse {
    readonly type: AwakeAiPortResponseType;
    readonly schedule?: AwakeAiPortSchedule[];
}

export class AwakeAiPortApi {
    private readonly url: string;
    private readonly apiKey: string;

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    /**
     * Queries the Awake.AI Voyages API for predictions
     * @param resource Resource/endpoint in the Voyages port API.
     * @param locode Destination LOCODE. If set, overrides destination prediction.
     * @param maxSequenceNo Maximum number of preceding stops in multi-hop predictions.
     */
    async getPredictions(
        resource: AwakeAiPortResource,
        locode: string,
        predictionType: AwakeAiPredictionType,
        maxSequenceNo = 1
    ): Promise<AwakeAiPortResponse> {
        const start = Date.now();
        try {
            const url = `${this.url}/port/${locode}/${resource}?maxSequenceNo=${maxSequenceNo}&predictionType=${predictionType}&predictionType=${AwakeAiPredictionType.ARRIVAL_PORT_CALL}&predictionMetadata=true`;
            console.info(`AwakeAiETAPortApi.getETAs calling URL ${url}`);
            const resp = await axios.get(url, {
                headers: {
                    Authorization: this.apiKey,
                    Accept: MediaType.APPLICATION_JSON
                },
                validateStatus: (status) => status == 200
            });
            return {
                type: AwakeAiPortResponseType.OK,
                schedule: resp.data as unknown as AwakeAiPortSchedule[]
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return AwakeAiPortApi.handleError(error);
            }
            throw error;
        } finally {
            console.log(`method=AwakeAiETAPortApi.getETAs tookMs=${Date.now() - start}`);
        }
    }

    async getETAs(locode: string, maxSequenceNo = 1) {
        return this.getPredictions(
            AwakeAiPortResource.ARRIVALS,
            locode,
            AwakeAiPredictionType.ETA,
            maxSequenceNo
        );
    }

    async getETDs(locode: string, maxSequenceNo = 1) {
        return this.getPredictions(
            AwakeAiPortResource.DEPARTURES,
            locode,
            AwakeAiPredictionType.ETD,
            maxSequenceNo
        );
    }

    static handleError(error: { response?: { status: number } }): AwakeAiPortResponse {
        if (!error.response) {
            return {
                type: AwakeAiPortResponseType.NO_RESPONSE
            };
        }
        switch (error.response.status) {
            case 404:
                return {
                    type: AwakeAiPortResponseType.PORT_NOT_FOUND
                };
            case 422:
                return {
                    type: AwakeAiPortResponseType.INVALID_LOCODE
                };
            case 500:
                return {
                    type: AwakeAiPortResponseType.SERVER_ERROR
                };
            default:
                return {
                    type: AwakeAiPortResponseType.UNKNOWN
                };
        }
    }
}
