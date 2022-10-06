import axios from 'axios';
import {MediaType} from "@digitraffic/common/aws/types/mediatypes";
import {ApiCounter} from "../model/counter";
import {ApiData} from "../model/data";
import {ApiChannel, ApiSite} from "../model/site";

export const URL_ALL_SITES = '/api/1.0/site';
export const URL_SITE_DATA = '/api/1.0/data/site';

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

        console.info("sending to url " + serverUrl);

        try {
            const resp = await axios.get(serverUrl, {
                headers: {
                    'accept': MediaType.APPLICATION_JSON,
                    'Authorization': this.token,
                },
            });
            if (resp.status !== 200) {
                console.error(`method=${method} returned status=${resp.status}`);
                return Promise.reject();
            }
            return resp.data;
        } catch (error) {
            console.error(`error from ${serverUrl}`);
            console.error(`method=${method} failed`);
            return Promise.reject();
        } finally {
            console.info(`method=${method} tookMs=${Date.now() - start}`);
        }
    }

    getSites(): Promise<ApiSite[]> {
        return this.getFromServer('getSites', URL_ALL_SITES);
    }

    getDataForSite(siteId: number, interval: number, from: Date, to: Date): Promise<ApiData[]> {
        const fromString = from.toISOString().substring(0, 19); // strip milliseconds
        const toString = to.toISOString().substring(0, 19);
        const intervalString = interval === 60 ? 'hour' : `${interval}m`;

        return this.getFromServer('getDataForSite', `${URL_SITE_DATA}/${siteId}?begin=${fromString}&end=${toString}&step=${intervalString}`);
    }

    async getAllCounters(): Promise<Record<string, ApiCounter>> {
        const sites = await this.getSites();

        const entries = sites.flatMap((site: ApiSite) => site.channels
            .filter(this.validate)
            .map((c: ApiChannel) => [c.id, {...c, ...{name: `${site.name} ${c.name}`}}]));

        // and finally create object from entries with id as key and counter as value
        return Object.fromEntries(entries);
    }

    validate(channel: ApiChannel): boolean {
        return channel.longitude > 0 && channel.latitude > 0;
    }
}