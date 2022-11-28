import axios, { AxiosResponse } from "axios";
import { FaultFeature } from "../model/fault";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";

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

                console.error("Fetching faults failed: %s", resp.statusText);

                return resp.data.features;
            })
            .catch((error) => {
                if (axios.isAxiosError(error)) {
                    console.error("fetching failed with %d", error.code);
                    console.error(error.message);
                } else {
                    console.error("error %s", error);
                }

                return [];
            });
    }

    private getFaultsFromServer(
        url: string
    ): Promise<AxiosResponse<ApiFeatures>> {
        const start = Date.now();

        console.info("getFaultsFromServer: getting faults from " + url);

        return axios
            .get<ApiFeatures>(url, {
                timeout: 10000,
                headers: {
                    Accept: MediaType.APPLICATION_JSON,
                },
            })
            .then((response) => {
                const end = Date.now();
                console.info(
                    "method=FaultsApi.getFaultsFromServer faultCount=%d tookMs=%d",
                    response.data.features.length,
                    end - start
                );
                return response;
            });
    }
}
