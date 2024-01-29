import axios from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { ApiCounter } from "../model/counter.js";
import type { ApiData } from "../model/data.js";
import type { ApiChannel, ApiSite } from "../model/site.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

export const URL_ALL_SITES = "/api/1.0/site";
export const URL_SITE_DATA = "/api/1.0/data/site";

export class EcoCounterApi {
    readonly token: string;
    readonly endpointUrl: string;

    constructor(apiKey: string, endpointUrl: string) {
        this.token = `Bearer ${apiKey}`;
        this.endpointUrl = endpointUrl;
    }

    async getFromServer<T>(method: string, url: string): Promise<T> {
        const start = Date.now();
        const serverUrl = `${this.endpointUrl}${url}`;

        logger.info({
            method: "EcoCounterApi.getFromServer",
            message: "sending to url " + serverUrl
        });

        try {
            const resp = await axios.get<T>(serverUrl, {
                headers: {
                    accept: MediaType.APPLICATION_JSON,
                    Authorization: this.token
                }
            });
            if (resp.status !== 200) {
                logger.error({
                    method: "EcoCounterApi.getFromServer",
                    customHttpMethod: method,
                    customStatus: resp.status
                });

                return Promise.reject();
            }
            return resp.data;
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
        return this.getFromServer("getSites", URL_ALL_SITES);
    }

    getDataForSite(siteId: number, interval: number, from: Date, to: Date): Promise<ApiData[]> {
        const fromString = from.toISOString().substring(0, 19); // strip milliseconds
        const toString = to.toISOString().substring(0, 19);
        const intervalString = interval === 60 ? "hour" : `${interval}m`;

        return this.getFromServer(
            "getDataForSite",
            `${URL_SITE_DATA}/${siteId}?begin=${fromString}&end=${toString}&step=${intervalString}`
        );
    }

    async getAllCounters(): Promise<Record<string, ApiCounter>> {
        const sites = await this.getSites();

        const entries = sites.flatMap((site: ApiSite) =>
            site.channels
                .filter((c) => this.validate(c))
                .map((c: ApiChannel): [ApiChannel["id"], ApiCounter] => [
                    c.id,
                    {
                        ...c,
                        ...{ name: `${site.name} ${c.name}` }
                    }
                ])
        );

        // and finally create object from entries with id as key and counter as value
        return Object.fromEntries(entries);
    }

    validate(channel: ApiChannel): boolean {
        return channel.longitude > 0 && channel.latitude > 0;
    }
}
