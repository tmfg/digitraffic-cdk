import axios, { AxiosError, AxiosResponse } from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { parseISO } from "date-fns";
import { ApiDevice, ApiWorkeventDevice } from "../model/paikannin-api-data";
import logger from "../service/maintenance-logger";

const URL_DEVICES = "/public/api/devices/all";
const URL_WORKEVENTS = "/public/api/devices/workevents/alldevices";

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
        logger.info({
            method: `PaikanninApi.constructor`,
            message: `using endpointUrl ${endpointUrl}`
        });
    }

    /**
     *
     * @param subMethod to append to log
     * @param url after domain. Ie. /api/contracts
     */
    private async getFromServer<T>(subMethod: string, url: string): Promise<T> {
        const start = Date.now();
        const serverUrl = `${this.endpointUrl}${url}`;
        const method = "PaikanninApi.getFromServer";
        let message: string;

        logger.info({
            method,
            message: `${subMethod} Sending to url ${serverUrl}`
        });

        try {
            const resp: AxiosResponse<T> = await axios
                .get<T>(serverUrl, {
                    headers: {
                        accept: MediaType.APPLICATION_JSON,
                        API_KEY: this.apikey
                    }
                })
                .catch((reason: AxiosError) => {
                    throw new Error(
                        `method=${subMethod} PaikanninApi.${subMethod} Sending to url ${serverUrl} failed. Error ${
                            reason.code ? reason.code : ""
                        } ${reason.message}`
                    );
                });
            if (resp.status !== 200) {
                logger.error({
                    method,
                    message: `${subMethod} returned data=${JSON.stringify(resp.data)} for ${serverUrl}`,
                    customStatus: resp.status
                });
                return Promise.reject(resp);
            }
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                if (axiosError.response) {
                    message = `${subMethod} GET failed for ${serverUrl}. Error response code: ${
                        axiosError.response.status
                    } and message: ${JSON.stringify(axiosError.response.data)}`;
                } else if (axiosError.request) {
                    message = `${subMethod} GET failed for ${serverUrl} with no response. Error message: ${axiosError.message}`;
                } else {
                    // Something happened in setting up the request that triggered an Error
                    message = `${subMethod} GET failed for ${serverUrl} while setting up the request. Error message: ${axiosError.message}`;
                }
            } else {
                message = `${subMethod} GET failed for ${serverUrl} outside axios.`;
            }
            logger.error({
                method,
                message,
                error
            });
            return Promise.reject(`method=${method} message="${message} ${JSON.stringify(error)}"`);
        } finally {
            logger.info({
                method,
                message: `${subMethod} for ${serverUrl}`,
                tookMs: Date.now() - start
            });
        }
    }

    public getDevices(): Promise<ApiDevice[]> {
        return this.getFromServer<ApiDevice[]>("getDevices", URL_DEVICES);
    }

    public getWorkEvents(startTimeInclusive: Date, endTimeInclusive: Date): Promise<ApiWorkeventDevice[]> {
        return this.getFromServer<ApiWorkeventDevice[]>(
            "getWorkEvents",
            `${URL_WORKEVENTS}/${startTimeInclusive.toISOString()}/${endTimeInclusive.toISOString()}`
        ).then((value) => {
            value.forEach((device) => {
                // Convert string to Date
                device.workEvents.forEach((event) => {
                    if (event.timest) {
                        event.timestamp = parseISO(event.timest);
                    }
                });
            });
            return value;
        });
    }
}
