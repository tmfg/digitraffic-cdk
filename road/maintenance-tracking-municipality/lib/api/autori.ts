import axios, {AxiosError, AxiosResponse} from 'axios';
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {ApiContractData, ApiOperationData, ApiRouteData} from "../model/data";
import moment from "moment";

export const URL_CONTRACTS = '/api/contracts';
export const URL_ROUTE = '/api/route';
export const URL_OPERATIONS = '/api/route/types/operation\n';

export class AutoriApi {
    readonly username: string;
    readonly password: string;
    readonly endpointUrl: string;

    /**
     * @param username Basic auth username
     * @param password Basic auth password
     * @param endpointUrl Enpoint url ie https://mydomain.com
     */
    constructor(username: string, password: string, endpointUrl: string) {
        this.username = username;
        this.password = password;
        this.endpointUrl = endpointUrl;
        console.info(`AutoriApi using endpointUrl ${endpointUrl}`);
    }

    /**
     *
     * @param method to log
     * @param url url after domain. Ie. /api/contracts
     */
    async getFromServer<T>(method: string, url: string): Promise<T> {
        const start = Date.now();
        const serverUrl = `${this.endpointUrl}${url}`;

        // console.info(`method=${method} Sending to url ${serverUrl}`);

        try {
            const resp : AxiosResponse = await axios.get(serverUrl, {
                headers: {
                    'accept': MediaType.APPLICATION_JSON,
                },
                // Axios looks for the `auth` option, and, if it is set, formats a
                // basic auth header for you automatically.
                auth: {
                    username: this.username,
                    password: this.password,
                },
            });
            if (resp.status !== 200) {
                console.error(`method=${method} returned status=${resp.status} data=${resp.data} for ${serverUrl}`);
                return Promise.reject();
            }
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                if (axiosError.response) {
                    console.error(`method=${method} GET failed for ${serverUrl}. Error response code: ${axiosError.response.status} and message: ${axiosError.response.data}`);
                } else if (axiosError.request) {
                    console.error(`method=${method} GET failed for ${serverUrl} with no response. Error message: ${axiosError.message}`);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error(`method=${method} GET failed for ${serverUrl} while setting up the request. Error message: ${axiosError.message}`);
                }
            } else {
                console.error(`method=${method} GET failed for ${serverUrl} outside axios. Error message: ${error}`);
            }
            return Promise.reject();
        } finally {
            console.info(`method=${method} tookMs=${Date.now() - start} for ${serverUrl}`);
        }
    }

    async getContracts(): Promise<ApiContractData[]> {
        return this.getFromServer('getContracts', URL_CONTRACTS);
    }

    async getOperations(): Promise<ApiOperationData[]> {
        return this.getFromServer('getOperations', URL_OPERATIONS);
    }

    /**
     * Gets next data after given time and period
     * @param contract id of the contract
     * @param from data that has been modified after (exclusive) this
     * @param periodHours how long period of data to fetch in hours
     */
    async getNextRouteDataForContract(contract: string, from: Date, periodHours : number): Promise<ApiRouteData[]> {
        const to = moment(from).add(periodHours, 'hours').add(1, 'ms'); // End and start are exclusive
        const data = await this.getRouteDataForContract(contract, from, to.toDate());
        if (data.length == 0) {
            if (to.isAfter(moment())) { // If we pass current date, then we give up
                console.info(`method=getNextRouteDataForContract No new data for contract ${contract}`);
                return [];
            }
            const nextFrom = moment(to).subtract(1, 'ms');
            return this.getNextRouteDataForContract(contract, nextFrom.toDate(), periodHours);
        }
        return data;
    }

    /**
     *
     * @param contract id of the contract
     * @param from data that has been modified after (exclusive) this
     * @param to data that has been modified before (exclusive) this
     */
    async getRouteDataForContract(contract: string, from: Date, to: Date): Promise<ApiRouteData[]> {
        const fromString = from.toISOString(); // With milliseconds Z-time
        const toString = to.toISOString();
        // console.info(`method=getRouteDataForContract ${contract} from=%s to=%s`, fromString, toString);
        // const routeData : Promise<ApiRouteData[]> = this.getFromServer(`getRouteDataForContract`, `${URL_ROUTE}?contract=${contract}&changedStart=${fromString}&changedEnd=${toString}`)
        //     .then();
        // return routeData;
        const start = Date.now();
        return this.getFromServer(`getRouteDataForContract`, `${URL_ROUTE}?contract=${contract}&changedStart=${fromString}&changedEnd=${toString}`)
            .then(response => {
                const end = Date.now();
                const routeData = response as ApiRouteData[];
                console.info(`method=getRouteDataForContract ${contract} from: ${fromString} to: ${toString} data count=${routeData.length} tookMs=${end-start}`, fromString, toString);
                return routeData;
            });
    }
}