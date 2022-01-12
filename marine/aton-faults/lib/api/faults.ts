import axios, {AxiosResponse} from 'axios';
import {Feature} from "geojson";

export function getFaults(endpointUrl: string): Promise<Feature[]> {
    return getFaultsFromServer(endpointUrl).then(resp => {
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

export function getFaultsFromServer(url: string): Promise<AxiosResponse> {
    const start = Date.now();

    console.info("getFaultsFromServer: getting faults from " + url);

    return axios.get(url, {
        timeout: 10000,
        headers: {
            'Accept': 'application/json',
        },
    }).then(response => {
        const end = Date.now();
        console.info("method=getFaultsFromServer faultCount=%d tookMs=%d", response.data.features.length, (end-start));
        return response;
    });
}
