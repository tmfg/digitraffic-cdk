import axios, {AxiosError, AxiosResponse} from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const queryString = require('query-string');
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {ApiContractData, ApiOperationData, ApiRouteData} from "../model/autori-api-data";
import {DbDomainContract} from "../model/db-data";
import {MaintenanceTrackingAutoriSecret} from "../model/maintenance-tracking-municipality-secret";

export const PATH_SUFFIX_CONTRACTS = 'contracts';
export const PATH_SUFFIX_ROUTE = 'route';
export const PATH_SUFFIX_ROUTE_OPERATIONS = 'route/types/operation\n';
export const O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS = 3 * 60 * 1000; // 3 minute safety gap to get new token

export class AutoriApi {

    private secret: MaintenanceTrackingAutoriSecret;
    private oAuthResponse: OAuthTokenResponse;
    private oAuthExpires: Date;

    /**
     * @param secret for the domain
     */
    constructor(secret: MaintenanceTrackingAutoriSecret) {
        this.secret = secret;
        console.info(`method=AutoriApi using endpointUrl ${secret.url}`);
    }

    /**
     *
     * @param method to log
     * @param pathSuffix path after https://<server>/api/<productId>/. Ie. 'contracts'
     */
    private async getFromServer<T>(method: string, pathSuffix: string): Promise<T> {
        const start = Date.now();
        // https://<server>/api/<productId>/<action>
        const serverUrl = `${this.secret.url}/api/${this.secret.productId}/${pathSuffix}`;

        console.info(`method=getFromServer.${method} Sending to url ${serverUrl}`);

        const token : OAuthTokenResponse = await this.getOAuthToken();

        try {
            const resp : AxiosResponse = await axios.get(serverUrl, {
                // OAuth 2.0 Authorization headers
                headers: {
                    'accept': MediaType.APPLICATION_JSON,
                    'Authorization': `Bearer ${token.access_token}`,
                },
            });
            if (resp.status !== 200) {
                console.error(`method=getFromServer.${method} returned status=${resp.status} data=${resp.data} for ${serverUrl}`);
                return Promise.reject();
            }
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                if (axiosError.response) {
                    console.error(`method=getFromServer.${method} GET failed for ${serverUrl}. Error response code: ${axiosError.response.status} and message: ${JSON.stringify(axiosError.response.data)}`);
                } else if (axiosError.request) {
                    console.error(`method=getFromServer.${method} GET failed for ${serverUrl} with no response. Error message: ${axiosError.message}`);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error(`method=getFromServer.${method} GET failed for ${serverUrl} while setting up the request. Error message: ${axiosError.message}`);
                }
            } else {
                console.error(`method=getFromServer.${method} GET failed for ${serverUrl} outside axios. Error message: ${JSON.stringify(error)}`);
            }
            return Promise.reject();
        } finally {
            console.debug(`method=getFromServer.${method} tookMs=${Date.now() - start} for ${serverUrl}`);
        }
    }

    public getContracts(): Promise<ApiContractData[]> {
        return this.getFromServer<ApiContractData[]>('getContracts', PATH_SUFFIX_CONTRACTS);
    }

    public getOperations(): Promise<ApiOperationData[]> {
        return this.getFromServer<ApiOperationData[]>('getOperations', PATH_SUFFIX_ROUTE_OPERATIONS);
    }

    /**
     * Gets next data after given time and period
     * @param contract id of the contract
     * @param from data that has been modified after (exclusive) this
     * @param to data that has been modified before (exclusive) this
     */
    public getNextRouteDataForContract( contract: DbDomainContract, from: Date, to: Date): Promise<ApiRouteData[]> {
        return this.getRouteDataForContract(contract, from, to)
            .catch(error => {
                console.error(`method=getNextRouteDataForContract domain=${contract.domain} contract=${contract.contract} startTime=${from.toISOString()} endTime=${to.toISOString()} error: ${error}`);
                throw error;
            });
    }

    /**
     *
     * @param contract id of the contract
     * @param from data that has been modified after (exclusive) this
     * @param to data that has been modified before (exclusive) this
     */
    private getRouteDataForContract(contract: DbDomainContract, from: Date, to: Date): Promise<ApiRouteData[]> {
        const fromString = from.toISOString(); // With milliseconds Z-time
        const toString = to.toISOString();
        const start = Date.now();

        return this.getFromServer<ApiRouteData[]>(`getRouteDataForContract`, `${PATH_SUFFIX_ROUTE}?contract=${contract.contract}&changedStart=${fromString}&changedEnd=${toString}`)
            .then(routeData => {
                const end = Date.now();
                console.debug(`DEBUG method=getRouteDataForContract domain=${contract.domain} contract=${contract.contract} startTime=${fromString} endTime=${toString} data count=${routeData.length} tookMs=${end-start}`);
                return routeData;
            }).catch(error => {
                console.error(`method=getRouteDataForContract domain=${contract.domain} contract=${contract.contract} startTime=${fromString} endTime=${toString} error: ${error}`);
                throw error;
            });
    }

    /**
     * Get OAuth 2.0 token
     * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow#first-%20case-access-token-request-with-a-shared-secret
     *
     * @private
     */
    public getOAuthToken() : Promise<OAuthTokenResponse> {
        console.log(`method=getOAuthToken`);

        if (this.isAuthTokenActive()) {
            const expiresInS = Math.floor((this.oAuthExpires.getTime()-Date.now())/1000);
            console.info(`DEBUG method=getOAuthToken from cache expires in ${expiresInS} s and calculated limit is ${this.oAuthExpires.toISOString()}`);
            return Promise.resolve(this.oAuthResponse);
        }

        const postData = {
            // eslint-disable-next-line camelcase
            client_id: this.secret.oAuthClientId,
            scope: this.secret.oAuthScope,
            // eslint-disable-next-line camelcase
            client_secret: this.secret.oAuthClientSecret,
            // eslint-disable-next-line camelcase
            grant_type: 'client_credentials',
        };

        return axios.post(this.secret.oAuthTokenEndpoint, queryString.stringify(postData), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
            .then(response => {
                this.oAuthResponse = response.data as OAuthTokenResponse;
                // response has expires in seconds -> convert to ms
                const expiresInMs = this.oAuthResponse.expires_in * 1000;
                const oAuthExpiresEpochMs = (new Date().getTime()) + expiresInMs - O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS;
                this.oAuthExpires = new Date(oAuthExpiresEpochMs);
                console.info(`method=getOAuthToken new token expires in ${this.oAuthResponse.expires_in} s and calculated limit is ${this.oAuthExpires.toISOString()}`);
                return this.oAuthResponse;
            })
            .catch(error => {
                // This will print i.e. "method=getOAuthToken failed, message: Request failed with status code 400, error: invalid_scope"
                const msg = `method=getOAuthToken failed, message: ${error.message}, error: ${error.response.data.error}`;
                console.error(msg);
                throw new Error(msg);
            });
    }

    /**
     * Checks if current auth token is still valid.
     * @private
     */
    private isAuthTokenActive() : boolean {
        return typeof this.oAuthResponse !== "undefined" &&
               typeof this.oAuthExpires !== "undefined" &&
               this.oAuthExpires.getTime() > Date.now();
    }
}

type OAuthTokenResponse = {
    readonly token_type: string,
    readonly expires_in: number,
    readonly access_token: string
}