import axios from 'axios';
import {MediaType} from "digitraffic-common/api/mediatypes";

export const URL_ALL_SITES = '/api/1.0/sites';
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

    async getDataForSite(siteId: number, from: Date): Promise<any> {
        const fromString = from.toISOString().substring(0, 19); // strip milliseconds
        
        return this.getFromServer('getDataForSite', `${URL_SITE_DATA}/${siteId}?begin=${fromString}`);
    }
}