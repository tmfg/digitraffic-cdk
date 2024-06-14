import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";
import type { FeatureCollection } from "geojson";

const LAYER_ACTIVE = "merivaroitus_julkaistu_dt" as const;
const LAYER_ARCHIVED = "merivaroitus_arkistoitu_dt" as const;

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
            const resp = await ky.get(url);

            if (resp.status !== 200) {
                logger.error({
                    method: `NauticalWarningsApi.getWarnings`,
                    message: `Got response code ${resp.status} ${resp.statusText}`
                });

                return Promise.reject(resp);
            }
            return Promise.resolve(resp.json<FeatureCollection>());
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
