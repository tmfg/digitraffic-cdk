import axios from 'axios';
import {AxiosError} from 'axios';
import {MediaType} from "digitraffic-common/api/mediatypes";
import {AreaTraffic} from "../model/areatraffic";

export class AreaLightsApi {

    private readonly url: string
    private readonly apiKey: string

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    async updateLightsForArea(areaTraffic: AreaTraffic): Promise<void> {
        const start = Date.now();
        try {
            const resp = await axios.post(this.url, areaTraffic, {
                headers: {
                    'api-key': this.apiKey
                }
            });
            if (resp.status !== 200) {
                console.error(`method=updateLightsForArea returned status=${resp.status}`);
                return Promise.reject();
            }
            return Promise.resolve(resp.data);
        } catch (error) {
            console.error('method=updateLightsForArea failed');
            throw new Error('Update lights for area failed');
        } finally {
            console.log(`method=updateLightsForArea tookMs=${Date.now() - start}`)
        }
    }
}
