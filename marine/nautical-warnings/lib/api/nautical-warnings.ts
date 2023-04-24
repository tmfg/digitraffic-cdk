import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
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
                logger.error({
                    method: "NauticalWarningsApi.getWarnings",
                    status: resp.status
                });

                return Promise.reject(resp);
            }
            return Promise.resolve(resp.data);
        } catch (error) {
            logException(logger, error as Error);

            return Promise.reject(error);
        } finally {
            logger.info({
                method: "NauticalWarningsApi.getWarnings",
                tookMs: Date.now() - start
            });
        }
    }
}
