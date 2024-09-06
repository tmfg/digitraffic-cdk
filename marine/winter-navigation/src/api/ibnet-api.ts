import type {
    EndpointResponse,
    Response,
    Location,
    Restriction,
    Vessel,
    Activity,
    Source
} from "../model/apidata.js";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";

export class IbnetApi {
    private _baseUrl: string;
    private _authHeaderValue: string;

    constructor(baseUrl: string, authHeaderValue: string) {
        this._baseUrl = baseUrl;
        this._authHeaderValue = authHeaderValue;
    }

    fetchFromUrl<T>(url: string): Promise<T> {
        logger.debug("Fetching from " + url);

        return ky
            .get(url, {
                timeout: 10000,
                headers: {
                    Authorization: `Basic ${this._authHeaderValue}`,
                    Accept: MediaType.APPLICATION_JSON
                }
            })
            .then(async (resp) => {
                if (resp.status !== 200) {
                    logger.error({
                        method: "IbnetApi.fetchFromUrl",
                        customStatus: resp.status,
                        customDetails: resp.statusText
                    });

                    throw new Error("Fetching failed");
                }

                return await resp.json<T>();
            });
    }

    async fetch<T>(path: string, from: number, to: number): Promise<T[]> {
        const start = Date.now();
        const url = `${this._baseUrl}${path}?from=${from}&to=${to}`;

        try {
            return await this.fetchFromUrl<T[]>(url);
        } catch (error) {
            logException(logger, error);

            return [];
        } finally {
            logger.info({
                method: "IbnetApi.fetch",
                tookMs: Date.now() - start
            });
        }
    }

    async getCurrentVersion(): Promise<number> {
        const response: EndpointResponse = await this.fetchFromUrl(this._baseUrl);

        return response.toRv;
    }

    getLocations(from: number, to: number): Promise<Response<Location>> {
        return this.fetch("location", from, to);
    }

    getRestrictions(from: number, to: number): Promise<Response<Restriction>> {
        return this.fetch("restriction", from, to);
    }

    getVessels(from: number, to: number): Promise<Response<Vessel>> {
        return this.fetch("vessel", from, to);
    }

    getActivities(from: number, to: number): Promise<Response<Activity>> {
        return this.fetch("activity", from, to);
    }

    getSources(from: number, to: number): Promise<Response<Source>> {
        return this.fetch("source", from, to);
    }
}
