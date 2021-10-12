import axios from "axios";
import axiosRetry from "axios-retry";

const LAYER_ACTIVE = 'merivaroitus_julkaistu_dt';
const LAYER_ARCHIVED = 'merivaroitus_arkistoitu_dt';

axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay});

export class NauticalWarningsApi {
    readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getActiveWarnings() {
        return this.getWarnings(LAYER_ACTIVE)
    }

    async getArchivedWarnings() {
        return this.getWarnings(LAYER_ARCHIVED);
    }

    async getWarnings(layer: string) {
        const start = Date.now();
        const url = `${this.baseUrl}?crs=EPSG:4326&layer=${layer}`;

        try {
            const resp = await axios.get(url);

            if (resp.status !== 200) {
                console.error(`method=getWarnings returned status=${resp.status}`);
                return Promise.reject(resp);
            }
            return Promise.resolve(resp.data);
        } catch (error) {
            console.error(`error ${error} from ${url}`);
            console.error('method=getWarnings failed');
            return Promise.reject(error);
        } finally {
            console.log(`method=getWarnings tookMs=${Date.now() - start}`)
        }
    }

}