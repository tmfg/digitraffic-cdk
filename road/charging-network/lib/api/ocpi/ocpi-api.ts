import { LoggerMethodType, logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import * as CommonDateUtils from "@digitraffic/common/dist/utils/date-utils";
import axios, { AxiosError, AxiosResponse } from "axios";
import { VersionsResponse } from "./ocpi-api-responses";

const SERVICE = "OcpiApi";

export interface ResponseWithHeader<T> {
    data: T;
    headers: Record<string, string>;
}

/**
 * @param endpointUrl Full url with the domain
 * @param token to use for authentication
 * @param headers to pick from response
 * @returns [returnValue, Record<header: value>] Returns api response data and given header values if found.
 *
 */
export async function getFromServer<T>(
    endpointUrl: string,
    token: string,
    headers?: string[]
): Promise<ResponseWithHeader<T>> {
    const start = Date.now();
    const method = `${SERVICE}.getFromServer` satisfies LoggerMethodType;

    logger.debug({
        method,
        customUrl: endpointUrl,
        message: "Send http GET request"
    });

    return axios
        .get<T>(endpointUrl, {
            headers: {
                Accept: MediaType.APPLICATION_JSON,
                Authorization: `Token ${token}`
            },
            validateStatus: function (status: number) {
                return status === 200 || status === 201; // Resolve only if the status code is 200 or 201
            }
        })
        .then((response) => {
            // Replaces all iso-date-time strings with Date-objects as axios can't do it
            replaceIsoDateStringsWithDateObject<T>(response.data);

            const pickedHeaders: Record<string, string> = {};
            if (headers) {
                headers.forEach((h) => {
                    pickedHeaders[h] = response.headers[h.toLowerCase()] as string;
                });
            }
            return { data: response.data, headers: pickedHeaders };
        })
        .catch((error: Error | AxiosError) => {
            const isAxiosError = axios.isAxiosError(error);
            const message = isAxiosError
                ? `GET failed with message: ${error.message}`
                : `GET failed outside axios with message ${error.message}`;
            logger.error({
                method,
                customUrl: endpointUrl,
                customStatus: isAxiosError ? error.status : undefined,
                customCode: isAxiosError ? error.code : undefined,
                customResponseData: isAxiosError ? JSON.stringify(error.response?.data) : undefined,
                customResponseStatus: isAxiosError ? error.response?.status : undefined,
                stack: error.stack,
                message
            });

            throw new Error(`${message} method=${method} url=${endpointUrl}`, { cause: error });
        })
        .finally(() => {
            logger.info({
                method,
                customUrl: endpointUrl,
                tookMs: Date.now() - start
            });
        });
}

/**
 * @param endpointUrl Full url with the domain
 * @param token to use for authentication
 * @param data to be sent as payload
 */
export async function postToServer<ResponseData, PostData>(
    endpointUrl: string,
    token: string,
    data: PostData
): Promise<ResponseData> {
    const start = Date.now();
    const method = `${SERVICE}.postToServer` satisfies LoggerMethodType;

    logger.info({
        method,
        customUrl: endpointUrl,
        message: "Send http POST request"
    });

    return axios
        .post<ResponseData, AxiosResponse<ResponseData>, PostData>(endpointUrl, data, {
            headers: {
                Accept: MediaType.APPLICATION_JSON,
                Authorization: `Token ${token}`
            },
            validateStatus: function (status: number) {
                return status === 200 || status === 201; // Resolve only if the status code is 200 or 201
            }
        })
        .then((response) => {
            return response.data;
        })
        .catch((error: AxiosError<ResponseData> | Error) => {
            const isAxiosError = axios.isAxiosError(error);
            const message = isAxiosError
                ? `POST failed with message: ${error.message}`
                : `POST failed outside axios with message ${error.message}`;
            logger.error({
                method,
                customUrl: endpointUrl,
                customStatus: isAxiosError ? error.status : undefined,
                customCode: isAxiosError ? error.code : undefined,
                customResponseData: isAxiosError ? JSON.stringify(error.response?.data) : undefined,
                customResponseStatus: isAxiosError ? error.response?.status : undefined,
                stack: error.stack,
                message
            });

            throw new Error(`${message} method=${method} url=${endpointUrl}`, { cause: error });
        })
        .finally(() => {
            logger.info({
                method,
                customUrl: endpointUrl,
                tookMs: Date.now() - start
            });
        });
}

export async function getVersions(versionsEndpoint: string, token: string): Promise<VersionsResponse> {
    const start = Date.now();
    const method = `${SERVICE}.getFromServer` satisfies LoggerMethodType;
    return getFromServer<VersionsResponse>(versionsEndpoint, token)
        .then((response) => {
            logger.debug({
                method,
                customUrl: versionsEndpoint,
                message: `Got version data ${JSON.stringify(response.data)}`
            });
            return response.data;
        })
        .finally(() => {
            logger.info({
                method,
                customUrl: versionsEndpoint,
                tookMs: Date.now() - start
            });
        });
}

/**
 * Iterates over all entries of the input object and replace the string dates with the objects of {@link Date}.
 */
export function replaceIsoDateStringsWithDateObject<T>(jsonObject: T): void {
    if (jsonObject) {
        // /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/;
        const regex =
            /^\d{4}-(0[1-9]|1[0-2])-([12]\d|0[1-9]|3[01])([T\s](([01]\d|2[0-3])\:[0-5]\d|24\:00)(\:[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3])\:?([0-5]\d)?)?)?$/;
        for (const [field, value] of Object.entries(jsonObject)) {
            if (typeof value === "string") {
                try {
                    if (value.match(regex)) {
                        // @ts-ignore
                        jsonObject[field as keyof typeof jsonObject] =
                            CommonDateUtils.dateFromIsoString(value);
                    }
                } catch (error) {
                    logger.error({
                        method: `${SERVICE}.replaceIsoDateStringsWithDateObject`,
                        message: `failed to convert field: ${field} from iso-date strings to Date objects`,
                        error: error
                    });
                }
            } else {
                replaceIsoDateStringsWithDateObject(value);
            }
        }
    }
}
