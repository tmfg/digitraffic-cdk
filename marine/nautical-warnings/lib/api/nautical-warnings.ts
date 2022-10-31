import axios from "axios";
import axiosRetry from "axios-retry";
import { FeatureCollection } from "geojson";

const LAYER_ACTIVE = "merivaroitus_julkaistu_dt";
const LAYER_ARCHIVED = "merivaroitus_arkistoitu_dt";

// eslint-disable-next-line @typescript-eslint/unbound-method
axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay });

export class NauticalWarningsApi {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    getActiveWarnings(): Promise<FeatureCollection> {
        return this.getWarnings(LAYER_ACTIVE);
    }

    getArchivedWarnings(): Promise<FeatureCollection> {
        return this.getWarnings(LAYER_ARCHIVED);
    }

    private async getWarnings(layer: string): Promise<FeatureCollection> {
        const start = Date.now();
        const url = `${this.baseUrl}?crs=EPSG:4326&layer=${layer}`;

        try {
            const resp = await axios.get<FeatureCollection>(url);

            if (resp.status !== 200) {
                console.error(
                    "method=getWarnings returned status=%d",
                    resp.status
                );
                return Promise.reject(resp);
            }
            return Promise.resolve(resp.data);
        } catch (error) {
            console.error("error %s from %s", error, url);
            console.error("method=getWarnings failed");
            return Promise.reject(error);
        } finally {
            console.log("method=getWarnings tookMs=%d", Date.now() - start);
        }
    }
}
