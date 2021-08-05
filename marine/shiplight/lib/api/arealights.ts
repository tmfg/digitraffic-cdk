import {AreaTraffic} from "../model/areatraffic";
import axios from 'axios';

export async function updateLightsForArea(areaTraffic: AreaTraffic, endpointUrl: string): Promise<any> {
    const start = Date.now();

    try {
        const resp = await axios.post(endpointUrl, areaTraffic);
        if (resp.status !== 200) {
            console.error(`method=updateLightsForArea returned status=${resp.status}`);
            return Promise.reject();
        }
        return Promise.resolve(resp.data);
    } catch (error) {
        console.error(`error ${error} from ${endpointUrl}`);
        console.error('method=updateLightsForArea failed');
        return Promise.reject();
    } finally {
        console.log(`method=updateLightsForArea tookMs=${Date.now() - start}`)
    }
}
