import {Fault} from "../model/fault";
import axios from 'axios';

export async function getFaults(endpointUrl: string): Promise<Fault[]> {
    const resp = await getFaultsFromServer(endpointUrl);

    if (resp.status != 200) {
        console.error('Fetching faults failed: ' + resp.statusText);

        return [];
    }

//    console.info("got resp " + JSON.stringify(resp.data));
    return resp.data.features;
}

export async function getFaultsFromServer(url: string) {
    const start = Date.now();

    console.info("getFaultsFromServer: getting faults from " + url);

    return await axios.get(url, {
        headers: {
            'Accept': 'application/json'
        }
    }).then(a => {
        const end = Date.now();
        console.info("method=getFaultsFromServer faultCount=%d tookMs=%d", a.data.features.length, (end-start));
        return a;
    });
}
