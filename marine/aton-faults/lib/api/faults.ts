import axios, {AxiosResponse} from 'axios';
import {FaultFeature} from "../model/fault";

export class FaultsApi {
    private readonly endpointUrl: string;

    constructor(endpointUrl: string) {
        this.endpointUrl = endpointUrl;
    }

    public getFaults(): Promise<FaultFeature[]> {
        return this.getFaultsFromServer(this.endpointUrl).then(resp => {
            if (resp.status === 200) {
                return resp.data.features;
            }

            console.error('Fetching faults failed: %s', resp.statusText);

            return resp.data.features;
        }).catch(error => {
            console.error("fetching failed with %d", error.status);
            console.error(error.message);

            return [];
        });
    }

    private getFaultsFromServer(url: string): Promise<AxiosResponse> {
        const start = Date.now();

        console.info("getFaultsFromServer: getting faults from " + url);

        return axios.get(url, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
            },
        }).then(response => {
            const end = Date.now();
            console.info("method=FaultsApi.getFaultsFromServer faultCount=%d tookMs=%d", response.data.features.length, (end-start));
            return response;
        });
    }
}

