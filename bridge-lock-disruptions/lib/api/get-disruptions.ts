import axios from 'axios';
import {Feature} from "geojson";

export async function getDisruptions(endpointUrl: string): Promise<Feature[]> {
    const resp = await getDisruptionsFromServer(endpointUrl);

    if (resp.status != 200) {
        console.error('Fetching disruptions failed: ' + resp.statusText);
        return [];
    }

    return resp.data.features;
}

export async function getDisruptionsFromServer(url: string) {
    const start = Date.now();

    console.info("getDisruptionsFromServer: getting disruptions from " + url);

    return await axios.get(url, {
        headers: {
            'Accept': 'application/json'
        }
    }).then(a => {
        const end = Date.now();
        console.info("method=getDisruptionsFromServer disruptionCount=%d tookMs=%d", a.data.features.length, (end-start));
        return a;
    });
}
