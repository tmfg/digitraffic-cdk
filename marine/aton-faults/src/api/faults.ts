import axios, { type AxiosResponse } from "axios";
import type { FaultFeature } from "../model/fault.js";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

interface ApiFeatures {
    features: FaultFeature[];
}

export class FaultsApi {
    private readonly endpointUrl: string;

    constructor(endpointUrl: string) {
        this.endpointUrl = endpointUrl;
    }

    public getFaults(): Promise<FaultFeature[]> {
        return this.getFaultsFromServer(this.endpointUrl)
            .then((resp) => {
                if (resp.status === 200) {
                    return resp.data.features;
                }

                logger.error({
                    method: "FaultsApi.getFaults",
                    message: "Fetching faults failed",
                    customDetails: resp.statusText
                });

                return resp.data.features;
            })
            .catch((error) => {
                logException(logger, error);

                return [];
            });
    }

    private getFaultsFromServer(url: string): Promise<AxiosResponse<ApiFeatures>> {
        const start = Date.now();

        return axios
            .get<ApiFeatures>(url, {
                timeout: 10000,
                headers: {
                    Accept: MediaType.APPLICATION_JSON
                }
            })
            .then((response) => {
                const end = Date.now();
                logger.info({
                    method: "FaultsApi.getFaultsFromServer",
                    tookMs: end - start,
                    customFaultCount: response.data.features.length
                });
                return response;
            });
    }
}
