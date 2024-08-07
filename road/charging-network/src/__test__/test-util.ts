import { hasOwnPropertySafe, setEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ChargingNetworkKeys } from "../keys.js";
import { v4 as uuidv4 } from "uuid";
import { jest } from "@jest/globals";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { ChargingNetworkSecret } from "../model/charging-network-secret.js";
import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

export const PORT = 8091 as const;

const OCPI_DOMAIN_URL = `http://localhost:${PORT}`;

export const DT_CPO_ID = "DT_OCPI" as const;
export const CPO_TOKEN_A = uuidv4();
export const CPO_VERSIONS_ENPOINT = `${OCPI_DOMAIN_URL}/ocpi/cpo/versions` as const;
export const CPO_2_1_1_ENPOINT = `${OCPI_DOMAIN_URL}/ocpi/cpo/2.1.1/` as const;
export const CPO_2_1_1_CREDENTIALS_ENPOINT = `${CPO_2_1_1_ENPOINT}credentials/` as const;
export const CPO_2_1_1_LOCATIONS_ENPOINT = `${CPO_2_1_1_ENPOINT}locations/` as const;
export const CPO_WEBSITE = "https://test-cpo.com" as const;
export const CPO_NAME = "Test CPO" as const;
export const CPO_PARTY_ID = "TCO" as const;
export const CPO_COUNTRY_CODE = "FI" as const;
export const CPO_TOKEN_C = uuidv4();

export function setTestEnv(): void {
    setEnvVariable("SECRET_ID", "TEST_SECRET");
    setEnvVariable("AWS_REGION", "aws-region");
    setEnvVariable(ChargingNetworkKeys.OCPI_DOMAIN_URL, OCPI_DOMAIN_URL);
    setEnvVariable(ChargingNetworkKeys.OCPI_PARTY_ID, "DTT");
    setEnvVariable(ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_NAME, `Digitraffic test`);
    setEnvVariable(ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_WEBSITE, "https://www.digitraffic.fi/");
}

export function mockProxyAndSecretHolder(): void {
    jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() => Promise.resolve());
    jest.spyOn(SecretHolder.prototype, "get").mockResolvedValue({} satisfies ChargingNetworkSecret);
}

export interface UrlResponsePairResponse<T> {
    readonly data: T;
    readonly headers?: Record<string, string>;
    readonly status?: number;
    readonly statusText?: string;
}

export interface UrlResponsePair<T> {
    readonly url: string;
    readonly response: UrlResponsePairResponse<T>;
}

export function withServer(urlResponsePairs: UrlResponsePair<unknown>[]): jest.SpiedFunction<never> {
    // @ts-ignore
    return jest
        .spyOn(axios, "get")
        .mockImplementation((_url: string, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
            for (const urlResponsePair of urlResponsePairs) {
                //const parsedURL = new URL(urlResponsePair.url);
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                logger.debug(`${_url} match with ${urlResponsePair.url}: ${_url.match(urlResponsePair.url)}`);
                if (_url.match(urlResponsePair.url)) {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    logger.debug(`${_url} matched and return ${urlResponsePair.response}`);
                    // eslint-disable-next-line
                    const aResponse: AxiosResponse<any> = {
                        data: urlResponsePair.response.data,
                        headers: urlResponsePair.response.headers || {},
                        status: urlResponsePair.response.status || 200,
                        statusText: urlResponsePair.response.statusText || "Success",
                        config: {} as unknown as InternalAxiosRequestConfig
                    } as unknown as AxiosResponse;
                    return Promise.resolve(aResponse);
                }
            }

            return Promise.resolve({
                status: 400,
                statusText: `None of the urls: ${urlResponsePairs.map((value) => value.url).toString()} matched with ${_url}`
            });
        });
}

export function withServerPost(urlResponsePairs: UrlResponsePair<unknown>[]): jest.SpiedFunction<never> {
    // @ts-ignore
    return jest
        .spyOn(axios, "post")
        .mockImplementation(
            (_url: string, _data?: unknown, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                for (const urlResponsePair of urlResponsePairs) {
                    const urlMatches = _url.match(urlResponsePair.url);
                    const urlMatchesStr = urlMatches ? urlMatches.toString() : "none";
                    logger.debug(`${_url} match with ${urlResponsePair.url}: ${urlMatchesStr}`);
                    if (_url.match(urlResponsePair.url)) {
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        logger.debug(`${_url} matched and return ${urlResponsePair.response}`);
                        // @ts-ignore
                        const aResponse = {
                            data: urlResponsePair.response.data,
                            headers: urlResponsePair.response.headers || {},
                            status: urlResponsePair.response.status || 200,
                            statusText: urlResponsePair.response.statusText || "Success",
                            config: {} as unknown as InternalAxiosRequestConfig
                        } as unknown as AxiosResponse;
                        return Promise.resolve(aResponse);
                    }
                }

                return Promise.resolve({
                    status: 400,
                    statusText: `None of the urls: ${urlResponsePairs.map((value) => value.url).toString()} matched with ${_url}`
                });
            }
        );
}

// @ts-ignore
export function decodeBody(response: LambdaResponse): string {
    return Buffer.from(response.body, "base64").toString();
}

export function decodeBodyToObject(response: LambdaResponse): object {
    return JSON.parse(Buffer.from(response.body, "base64").toString()) as object;
}

export function prettyJson(object: object | string, nullifyFields?: [string]): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const json: object = typeof object === "string" ? JSON.parse(object) : object;
    if (nullifyFields && nullifyFields.length) {
        nullifyFields.forEach((field) => {
            if (hasOwnPropertySafe(json, field)) {
                // @ts-ignore
                json[field as keyof typeof json] = null;
            }
        });
    }
    return JSON.stringify(json, null, 2);
}

export function getLambdaInputAuthorizerEvent(dtCpoId: string | undefined): Record<string, string> {
    return {
        "authorizer.dtCpoId": `[${dtCpoId ? dtCpoId : ""}]`
    };
}

export function roundToNearestSecond(date: Date): Date {
    return new Date(1000 * Math.round(date.getTime() / 1000));
}
