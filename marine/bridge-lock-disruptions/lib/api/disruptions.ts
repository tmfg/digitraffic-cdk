import axios from 'axios';
import {Feature} from "geojson";

export async function getDisruptions(endpointUrl: string): Promise<Feature[]> {
    const resp = await getDisruptionsFromServer(endpointUrl);
    if (resp.status !== 200) {
        console.error('Fetching disruptions failed: ' + resp.statusText);
        throw new Error('Fetching disruptions failed');
    }
    return resp.data.features;
}

export function getDisruptionsFromServer(url: string) {
    const start = Date.now();
    return axios.get(url, {
        headers: {
            'Accept': 'application/json',
        },
    }).then(a => {
        const end = Date.now();
        console.info("method=getDisruptionsFromServer disruptionCount=%d tookMs=%d", a.data.features.length, (end-start));
        return a;
    });
}
