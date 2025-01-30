import axios, { type AxiosError } from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import {
  type ApiContractData,
  type ApiOperationData,
  type ApiRouteData,
} from "../model/autori-api-data.js";
import { type DbDomainContract } from "../model/db-data.js";
import { type MaintenanceTrackingAutoriSecret } from "../model/maintenance-tracking-municipality-secret.js";
import { URLSearchParams } from "url";
import logger from "../service/maintenance-logger.js";

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
      new Date().getTime() +
        (expires_in * 1000 - O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS),
    );
    logger.info({
      method: "OAuthTokenResponse.constructor",
      customExpiresIn: expires_in,
      customExpiresCalculated: this.expires.toISOString(),
    });
  }

  static createFromAuthResponse(
    partialToken: Partial<OAuthTokenResponse>,
  ): OAuthTokenResponse | undefined {
    if (
      partialToken.token_type && partialToken.expires_in &&
      partialToken.access_token
    ) {
      return new OAuthTokenResponse(
        partialToken.token_type,
        partialToken.expires_in,
        partialToken.access_token,
      );
    }

    return undefined;
  }

  /**
   * Checks if current auth token is still valid.
   * @private
   */
  isActive(): boolean {
    logger.debug({
      method: "OAuthTokenResponse.isActive",
      customResult: `expires=${this.expires.toISOString()} > now=${
        new Date().toISOString()
      } : ${
        JSON.stringify(
          this.expires.getTime() > Date.now(),
        )
      }`,
      customResultCalculation: `${this.expires.getTime()} > ${Date.now()} : ${
        JSON.stringify(
          this.expires.getTime() > Date.now(),
        )
      }`,
    });
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
      message: `using endpointUrl ${secret.url}`,
    });
  }

  /**
   * @param callerMethod to log
   * @param pathSuffix path after https://<server>/api/<productId>/. Ie. 'contracts'
   */
  private async getFromServer<T>(
    callerMethod: string,
    pathSuffix: string,
  ): Promise<T> {
    const start = Date.now();
    // https://<server>/api/<productId>/<action>
    const serverUrl =
      `${this.secret.url}/api/${this.secret.productId}/${pathSuffix}`;
    const method = "AutoriApi.getFromServer";
    logger.info({
      method,
      message: `${callerMethod} sending to url ${serverUrl}`,
    });

    const token: OAuthTokenResponse = await this.getOAuthToken();

    return axios
      .get<T>(serverUrl, {
        // OAuth 2.0 Authorization headers
        headers: {
          accept: MediaType.APPLICATION_JSON,
          Authorization: `Bearer ${token.access_token}`,
        },
        validateStatus: function (status: number) {
          return status === 200; // Resolve only if the status code is 200
        },
      })
      .then((value) => {
        return value.data;
      })
      .catch((error: Error | AxiosError) => {
        const isAxiosError = axios.isAxiosError(error);
        const message = `method=${method} message=${callerMethod} ` +
          (isAxiosError
            ? `GET failed with message: ${error.message}`
            : `GET failed outside axios with message ${error.message}`);
        logger.error({
          method,
          message,
          customCallerMethod: callerMethod,
          customUrl: serverUrl,
          customStatus: isAxiosError ? error.status : undefined,
          customCode: isAxiosError ? error.code : undefined,
          customResponseData: isAxiosError
            ? JSON.stringify(error.response?.data)
            : undefined,
          customResponseStatus: isAxiosError
            ? error.response?.status
            : undefined,
          stack: error.stack,
        });
        throw new Error(
          `${message} method=${method} callerMethod=${callerMethod} url=${serverUrl}`,
          {
            cause: error,
          },
        );
      })
      .finally(() => {
        logger.info({
          method,
          customCallerMethod: callerMethod,
          customUrl: serverUrl,
          tookMs: Date.now() - start,
        });
      });
  }

  public getContracts(): Promise<ApiContractData[]> {
    return this.getFromServer<ApiContractData[]>(
      "getContracts",
      PATH_SUFFIX_CONTRACTS,
    );
  }

  public getOperations(): Promise<ApiOperationData[]> {
    return this.getFromServer<ApiOperationData[]>(
      "getOperations",
      PATH_SUFFIX_ROUTE_OPERATIONS,
    );
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
    to: Date,
  ): Promise<ApiRouteData[]> {
    return this.getRouteDataForContract(contract, from, to).catch(
      (error: Error) => {
        logger.error({
          method: "AutoriApi.getNextRouteDataForContract",
          message:
            `startTime=${from.toISOString()} endTime=${to.toISOString()}`,
          customDomain: contract.domain,
          customContract: contract.contract,
          error,
        });
        throw error;
      },
    );
  }

  /**
   * @param contract id of the contract
   * @param from data that has been modified after (exclusive) this
   * @param to data that has been modified before (exclusive) this
   */
  private getRouteDataForContract(
    contract: DbDomainContract,
    from: Date,
    to: Date,
  ): Promise<ApiRouteData[]> {
    const fromString = from.toISOString(); // With milliseconds Z-time
    const toString = to.toISOString();
    const start = Date.now();

    return this.getFromServer<ApiRouteData[]>(
      `getRouteDataForContract`,
      `${PATH_SUFFIX_ROUTE}?contract=${contract.contract}&changedStart=${fromString}&changedEnd=${toString}`,
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
          error,
        });
        throw error;
      })
      .finally(() => {
        logger.info({
          method: "AutoriApi.getRouteDataForContract",
          message: `startTime=${fromString} endTime=${toString}`,
          customDomain: contract.domain,
          customContract: contract.contract,
          tookMs: Date.now() - start,
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
    const method = "AutoriApi.getOAuthToken";

    if (this.oAuthResponse?.isActive()) {
      logger.debug({
        method,
        message:
          `get from cache expires ${this.oAuthResponse.expires.toISOString()} (safety margin ${O_AUTH_EXPIRATION_SAFETY_DELTA_IN_MS} ms)`,
      });
      return Promise.resolve(this.oAuthResponse);
    }

    const postData = {
      client_id: this.secret.oAuthClientId,
      scope: this.secret.oAuthScope,

      client_secret: this.secret.oAuthClientSecret,

      grant_type: "client_credentials",
    };

    const url = this.secret.oAuthTokenEndpoint;
    return axios
      .post<Partial<OAuthTokenResponse>>(
        url,
        new URLSearchParams(postData).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          validateStatus: function (status: number) {
            return status === 200; // Resolve only if the status code is 200
          },
        },
      )
      .then((response) => {
        this.oAuthResponse = OAuthTokenResponse.createFromAuthResponse(
          response.data,
        );
        if (this.oAuthResponse === undefined) {
          throw new Error("Invalid OAuth token");
        }
        logger.info({
          method,
          message:
            `new token expires in ${this.oAuthResponse.expires_in} s and calculated limit is ${this.oAuthResponse.expires.toISOString()}`,
        });
        return this.oAuthResponse;
      })
      .catch((error: Error | AxiosError) => {
        const isAxiosError = axios.isAxiosError(error);
        const message = isAxiosError
          ? `POST failed with message: ${error.message}`
          : `POST failed outside axios with message ${error.message}`;
        logger.error({
          method,
          message,
          customUrl: url,
          customStatus: isAxiosError ? error.status : undefined,
          customCode: isAxiosError ? error.code : undefined,
          customResponseData: isAxiosError
            ? JSON.stringify(error.response?.data)
            : undefined,
          customResponseStatus: isAxiosError
            ? error.response?.status
            : undefined,
          stack: error.stack,
        });
        throw new Error(`${message} method=${method} url=${url}`, {
          cause: error,
        });
      })
      .finally(() => {
        logger.info({
          method,
          tookMs: Date.now() - start,
        });
      });
  }
}
