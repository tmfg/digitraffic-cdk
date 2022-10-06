import axios, {AxiosError, AxiosResponse} from 'axios';
import {MediaType} from "@digitraffic/common/aws/types/mediatypes";
import moment from "moment";
import {ApiDevice, ApiWorkeventDevice} from "../model/paikannin-api-data";

const URL_DEVICES = '/public/api/devices/all';
const URL_WORKEVENTS = '/public/api/devices/workevents/alldevices';

export class PaikanninApi {
    readonly apikey: string;
    readonly endpointUrl: string;

    /**
     * @param apikey ApiKey for auth
     * @param endpointUrl Enpoint url ie https://mydomain.com
     */
    constructor(apikey: string, endpointUrl: string) {
        this.apikey = apikey;
        this.endpointUrl = endpointUrl;
        console.info(`PaikanninApi using endpointUrl ${endpointUrl}`);
    }

    /**
     *
     * @param method to log
     * @param url url after domain. Ie. /api/contracts
     */
    private async getFromServer<T>(method: string, url: string): Promise<T> {
        const start = Date.now();
        const serverUrl = `${this.endpointUrl}${url}`;

        console.info(`method=PaikanninApi.${method} Sending to url ${serverUrl}`);

        try {
            const resp : AxiosResponse = await axios.get<T>(serverUrl, {
                headers: {
                    'accept': MediaType.APPLICATION_JSON,
                    'API_KEY': this.apikey,
                },
            });
            if (resp.status !== 200) {
                console.error(`method=PaikanninApi.getFromServer.${method} returned status=${resp.status} data=${resp.data} for ${serverUrl}`);
                return Promise.reject(resp);
            }
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                if (axiosError.response) {
                    console.error(`method=PaikanninApi.getFromServer.${method} GET failed for ${serverUrl}. ` +
                                  `Error response code: ${axiosError.response.status} and message: ${axiosError.response.data}`);
                } else if (axiosError.request) {
                    console.error(`method=PaikanninApi.getFromServer.${method} GET failed for ${serverUrl} with no response. ` +
                                  `Error message: ${axiosError.message}`);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error(`method=PaikanninApi.getFromServer.${method} GET failed for ${serverUrl} while setting up the request. ` +
                                  `Error message: ${axiosError.message}`);
                }
            } else {
                console.error(`method=PaikanninApi.getFromServer.${method} GET failed for ${serverUrl} outside axios. Error message: ${error}`);
            }
            return Promise.reject();
        } finally {
            console.info(`method=PaikanninApi.getFromServer.${method} tookMs=${Date.now() - start} for ${serverUrl}`);
        }
    }

    public getDevices(): Promise<ApiDevice[]> {
        return this.getFromServer<ApiDevice[]>('getDevices', URL_DEVICES);
    }

    public getWorkEvents(startTimeInclusive: Date, endTimeInclusive: Date): Promise<ApiWorkeventDevice[]> {
        return this.getFromServer<ApiWorkeventDevice[]>('getWorkEvents', `${URL_WORKEVENTS}/${startTimeInclusive.toISOString()}/${endTimeInclusive.toISOString()}`)
            .then(value => {
                value.forEach(device => {
                    // Convert string to Date
                    device.workEvents.forEach(event => {
                        if (event.timest) {
                            event.timestamp = moment(event.timest, moment.ISO_8601).toDate();
                        }
                    });
                });
                return value;
            });
    }
}
