import axios, { AxiosError, AxiosResponse } from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { ApiContractData, ApiOperationData, ApiRouteData } from "../model/autori-api-data";
import { DbDomainContract } from "../model/db-data";
import { MaintenanceTrackingAutoriSecret } from "../model/maintenance-tracking-municipality-secret";
import { URLSearchParams } from "url";
import logger from "../service/maintenance-logger";

export const PATH_SUFFIX_CONTRACTS = "contracts";
export const PATH_SUFFIX_ROUTE = "route";
export const PATH_SUFFIX_ROUTE_OPERATIONS = "route/types/operation";
export const O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS = 3 * 60 * 1000; // 3 minute safety gap to get new token

class OAuthTokenResponse {
    readonly token_type: string;
    readonly expires_in: number;
    readonly expires: Date;
    readonly access_token: string;

    constructor(token_type: string, expires_in: number, access_token: string) {
        this.token_type = token_type;
        this.expires_in = expires_in;
        this.access_token = access_token;
        this.expires = new Date(
            new Date().getTime() + (expires_in * 1000 - O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS)
        );
    }

    static createFromAuthResponse(partialToken: Partial<OAuthTokenResponse>): OAuthTokenResponse | undefined {
        if (partialToken.token_type && partialToken.expires_in && partialToken.access_token) {
            return new OAuthTokenResponse(
                partialToken.token_type,
                partialToken.expires_in,
                partialToken.access_token
            );
        }

        return undefined;
    }

    /**
     * Checks if current auth token is still valid.
     * @private
     */
    isActive(): boolean {
        return this.expires.getTime() > Date.now();
    }
}
export class AutoriApi {
    private secret: MaintenanceTrackingAutoriSecret;
    private oAuthResponse: OAuthTokenResponse | undefined;

    /**
     * @param secret for the domain
     */
    constructor(secret: MaintenanceTrackingAutoriSecret) {
        this.secret = secret;
        logger.info({
            method: "AutoriApi.constructor",
            message: `using endpointUrl ${secret.url}`
        });
    }

    /**
     *
     * @param subMethod to log
     * @param pathSuffix path after https://<server>/api/<productId>/. Ie. 'contracts'
     */
    private async getFromServer<T>(subMethod: string, pathSuffix: string): Promise<T> {
        const start = Date.now();
        // https://<server>/api/<productId>/<action>
        const serverUrl = `${this.secret.url}/api/${this.secret.productId}/${pathSuffix}`;
        const method = "AutoriApi.getFromServer";
        logger.info({
            method,
            message: `${subMethod} sending to url ${serverUrl}`
        });

        const token: OAuthTokenResponse = await this.getOAuthToken();

        try {
            const resp: AxiosResponse<T> = await axios
                .get<T>(serverUrl, {
                    // OAuth 2.0 Authorization headers
                    headers: {
                        accept: MediaType.APPLICATION_JSON,
                        Authorization: `Bearer ${token.access_token}`
                    }
                })
                .catch((reason: AxiosError) => {
                    throw new Error(
                        `method=${method} message="${subMethod} sending to url ${serverUrl} failed. Error ${
                            reason.code ? reason.code : ""
                        } ${reason.message}"`
                    );
                });
            if (resp.status !== 200) {
                const message = `${subMethod} returned status=${resp.status} data=${JSON.stringify(
                    resp.data
                )} for ${serverUrl}`;
                logger.error({
                    method,
                    message
                });
                return Promise.reject(`method=${method} message=${message}`);
            }
            return resp.data;
        } catch (error) {
            let message: string;
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
                message = `${subMethod} GET failed for ${serverUrl} outside axios. Error message: ${JSON.stringify(
                    error
                )}`;
            }
            logger.error({
                method,
                message
            });
            throw new Error(`method=AutoriApi.getFromServer failed ${message}`);
        } finally {
            logger.info({
                method,
                message: `${subMethod} for ${serverUrl}`,
                tookMs: Date.now() - start
            });
        }
    }

    public getContracts(): Promise<ApiContractData[]> {
        return this.getFromServer<ApiContractData[]>("getContracts", PATH_SUFFIX_CONTRACTS);
    }

    public getOperations(): Promise<ApiOperationData[]> {
        return this.getFromServer<ApiOperationData[]>("getOperations", PATH_SUFFIX_ROUTE_OPERATIONS);
    }

    /**
     * Gets next data after given time and period
     * @param contract id of the contract
     * @param from data that has been modified after (exclusive) this
     * @param to data that has been modified before (exclusive) this
     */
    public getNextRouteDataForContract(
        contract: DbDomainContract,
        from: Date,
        to: Date
    ): Promise<ApiRouteData[]> {
        return this.getRouteDataForContract(contract, from, to).catch((error: Error) => {
            logger.error({
                method: "AutoriApi.getNextRouteDataForContract",
                message: `startTime=${from.toISOString()} endTime=${to.toISOString()}`,
                customDomain: contract.domain,
                customContract: contract.contract,
                error
            });
            throw error;
        });
    }

    /**
     *
     * @param contract id of the contract
     * @param from data that has been modified after (exclusive) this
     * @param to data that has been modified before (exclusive) this
     */
    private getRouteDataForContract(
        contract: DbDomainContract,
        from: Date,
        to: Date
    ): Promise<ApiRouteData[]> {
        const fromString = from.toISOString(); // With milliseconds Z-time
        const toString = to.toISOString();
        const start = Date.now();

        return this.getFromServer<ApiRouteData[]>(
            `getRouteDataForContract`,
            `${PATH_SUFFIX_ROUTE}?contract=${contract.contract}&changedStart=${fromString}&changedEnd=${toString}`
        )
            .then((routeData) => {
                return routeData;
            })
            .catch((error: Error) => {
                logger.error({
                    method: "AutoriApi.getRouteDataForContract",
                    message: `startTime=${fromString} endTime=${toString}`,
                    customDomain: contract.domain,
                    customContract: contract.contract,
                    error
                });
                throw error;
            })
            .finally(() => {
                logger.info({
                    method: "AutoriApi.getRouteDataForContract",
                    message: `startTime=${fromString} endTime=${toString}`,
                    customDomain: contract.domain,
                    customContract: contract.contract,
                    tookMs: Date.now() - start
                });
            });
    }

    /**
     * Get OAuth 2.0 token
     * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow#first-%20case-access-token-request-with-a-shared-secret
     *
     * @private
     */
    public getOAuthToken(): Promise<OAuthTokenResponse> {
        const start = Date.now();
        if (this.oAuthResponse?.isActive()) {
            logger.debug(
                `method=AutoriApi.getOAuthToken from cache expires in ${
                    this.oAuthResponse.expires_in
                } s and calculated limit is ${this.oAuthResponse.expires.toISOString()}`
            );
            return Promise.resolve(this.oAuthResponse);
        }

        const postData = {
            client_id: this.secret.oAuthClientId,
            scope: this.secret.oAuthScope,

            client_secret: this.secret.oAuthClientSecret,

            grant_type: "client_credentials"
        };

        return axios
            .post<Partial<OAuthTokenResponse>>(
                this.secret.oAuthTokenEndpoint,
                new URLSearchParams(postData).toString(),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
            )
            .then((response) => {
                this.oAuthResponse = OAuthTokenResponse.createFromAuthResponse(response.data);
                if (this.oAuthResponse === undefined) {
                    throw new Error("Invalid OAuth token");
                }
                logger.info({
                    method: "AutoriApi.getOAuthToken",
                    message: `new token expires in ${
                        this.oAuthResponse.expires_in
                    } s and calculated limit is ${this.oAuthResponse.expires.toISOString()}`
                });
                return this.oAuthResponse;
            })
            .catch((error: AxiosError) => {
                // This will print i.e. "method=getOAuthToken failed, message: Request failed with status code 400, error: invalid_scope"
                const message = `failed, message: ${error.message}, error: ${JSON.stringify(
                    error.response?.data
                )}`;
                logger.error({
                    method: "AutoriApi.getOAuthToken",
                    message
                });
                throw new Error(`method=AutoriApi.getOAuthToken ${message}`);
            })
            .finally(() => {
                logger.info({
                    method: "AutoriApi.getOAuthToken",
                    tookMs: Date.now() - start
                });
            });
    }
}
