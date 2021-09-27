import axios from 'axios';
import {MediaType} from "digitraffic-common/api/mediatypes";
import {ApiCounter} from "../model/counter";

export const URL_ALL_SITES = '/api/1.0/site';
export const URL_SITE_DATA = '/api/1.0/data/site'

export class EcoCounterApi {
    readonly token: string;
    readonly endpointUrl: string;

    constructor(apiKey: string, endpointUrl: string) {
        this.token = `Bearer ${apiKey}`;
        this.endpointUrl = endpointUrl;
    }

    async getFromServer(method: string, url: string): Promise<any> {
        const start = Date.now();
        const serverUrl = `${this.endpointUrl}${url}`;

        console.info("sending to url " + serverUrl);

        try {
            const resp = await axios.get(serverUrl, {
                headers: {
                    'accept': MediaType.APPLICATION_JSON,
                    'Authorization': this.token
                }
            });
            if (resp.status !== 200) {
                console.error(`method=${method} returned status=${resp.status}`);
                return Promise.reject(resp);
            }
            return Promise.resolve(resp.data);
        } catch (error) {
            console.error(`error ${error} from ${serverUrl}`);
            console.error(`method=${method} failed`);
            return Promise.reject(error);
        } finally {
            console.log(`method=${method} tookMs=${Date.now() - start}`)
        }
    }

    async getSites(): Promise<any> {
        return this.getFromServer('getSites', URL_ALL_SITES);
    }

    async getDataForSite(siteId: number, interval: number, from: Date, to: Date): Promise<any> {
        const fromString = from.toISOString().substring(0, 19); // strip milliseconds
        const toString = to.toISOString().substring(0, 19);
        const intervalString = interval === 60 ? 'hour' : `${interval}m`;
        
        return this.getFromServer('getDataForSite', `${URL_SITE_DATA}/${siteId}?begin=${fromString}&end=${toString}&step=${intervalString}`);
    }

    async getAllCounters(): Promise<Record<string, [ApiCounter]>> {
        const sites = await this.getSites();
        const entries: any = [];

        sites.forEach((site: any) => {
            // create entries [id, channel]
            site.channels.forEach((c: any) => {
                if(this.validate(c)) {
                    // override channel name with domain_name + channel_name
                    entries.push([c.id, {...c, ...{name: `${site.name} ${c.name}`}}]);
                }
            });
        });

        // and finally create object from entries with id as key ad counter as value
        return Object.fromEntries(entries);
    }

    validate(channel: any): boolean {
        return channel.longitude > 0 && channel.latitude > 0;
    }
}