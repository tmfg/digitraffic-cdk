import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { ApiSite, ApiData } from "../../model/v2/api-model.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";

export const URL_ALL_SITES = "/api/v2/sites?include=domain";
export const URL_SITE_DATA = "/api/v2/history/traffic/raw";

export class EcoCounterApi {
    readonly _apiKey: string;
    readonly _endpointUrl: string;

    constructor(endpointUrl: string, apiKey: string) {
        this._endpointUrl = endpointUrl;
        this._apiKey = apiKey;
    }

    async getFromServer<T>(url: string): Promise<T> {
        const start = Date.now();
        const serverUrl = `${this._endpointUrl}${url}`;

        logger.info({
            method: "EcoCounterApi.getFromServer",
            message: "sending to url " + serverUrl
        });

        try {
            const resp = await ky.get(serverUrl, {
                headers: {
                    accept: MediaType.APPLICATION_JSON,
                    "Accept-Encoding": "gzip, deflate, br",
                    "X-API-KEY": this._apiKey
                }
            });

            if (resp.status !== 200) {
                logger.error({
                    method: "EcoCounterApi.getFromServer",
                    customStatus: resp.status
                });

                return Promise.reject();
            }
            return await resp.json<T>();
        } catch (error) {
            logException(logger, error);

            return Promise.reject();
        } finally {
            logger.info({
                method: "EcoCounterApi.getFromServer",
                tookMs: Date.now() - start
            });
        }
    }

    getSites(): Promise<ApiSite[]> {
        return this.getFromServer(URL_ALL_SITES);
    }

    getDataForSite(siteId: number, from: Date, to: Date): Promise<ApiData[]> {
        const fromIsoString = from.toISOString();
        const toIsoString = to.toISOString();
        const fromString = fromIsoString.substring(0, 10); // take just date, YYYY-MM-DD
        const toString = toIsoString.substring(0, 10);
        const fromTime = fromIsoString.substring(11, 16); // take just time, HH:MM
        const toTime = toIsoString.substring(11, 16);
//        const fromTime = "21%3A00";
  //      const toTime = "21%3A00";

        return this.getFromServer(
            `${URL_SITE_DATA}?siteId=${siteId}&startDate=${fromString}&endDate=${toString}&startTime=${fromTime}&endTime=${toTime}`
        );
    }    
}
