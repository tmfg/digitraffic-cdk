import {
    EndpointHttpMethod,
    EndpointProtocol,
    type MonitoredApp,
    type MonitoredEndpoint
} from "../../app-props.js";
import { DigitrafficApi } from "../../api/digitraffic-api.js";
import type { AppWithEndpoints } from "../../model/app-with-endpoints.js";
import axios, { type AxiosRequestConfig } from "axios";
import { jest } from "@jest/globals";

const SERVER_PORT = 8090;
const digitrafficApi = new DigitrafficApi();

const API_1 = "/api/maintenance/v1/tracking/domains" as const;
const API_2 = "/api/maintenance/v1/tracking/routes" as const;
const API_WITH_PARAMS = "/api/maintenance/v1/tracking/routes/{id}" as const;

describe("DigitrafficApiTest", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("getAppEndpoints - no exceptions", async () => {
        await getAppEndpointsAndExpect([API_1, API_2]);
    });

    test("getAppEndpoints - api with parameters excluded", async () => {
        await getAppEndpointsAndExpect([API_1], [API_1, API_WITH_PARAMS]);
    });

    test("getAppEndpoints - with exclude", async () => {
        await getAppEndpointsAndExpect([API_1], [API_1, API_2], [API_2]);
    });

    test("getAppEndpoints - with extra", async () => {
        await getAppEndpointsAndExpect([API_1], [API_1], [], [API_2]);
    });

    async function getAppEndpointsAndExpect(
        expectedApis: string[],
        apis: string[] = expectedApis,
        excluded: string[] = [],
        extraEndpoints: string[] = []
    ): Promise<void> {
        const extraEndpointValues: MonitoredEndpoint[] = extraEndpoints.map((e): MonitoredEndpoint => {
            return {
                name: e,
                url: e,
                protocol: EndpointProtocol.HTTP,
                method: EndpointHttpMethod.GET
            };
        });

        const monitoredApp = {
            name: "Road",
            hostPart: "tie",
            url: `http://localhost:${SERVER_PORT}/swagger/openapi.json`,
            excluded,
            endpoints: extraEndpointValues
        } satisfies MonitoredApp;

        const spy = jest
            .spyOn(axios, "get")
            .mockImplementation((_url: string, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                expect(_url).toEqual(monitoredApp.url);
                return Promise.resolve({
                    status: 200,
                    data: getOpenApiJson(apis)
                });
            });

        const appWithEndpoints: AppWithEndpoints = await digitrafficApi.getAppWithEndpoints(monitoredApp);

        expectBothContainsAll(expectedApis, appWithEndpoints.endpoints);

        if (extraEndpoints.length) {
            const actualExtraEndpoints = appWithEndpoints.extraEndpoints.map((ep) => ep.url);
            expectBothContainsAll(extraEndpoints, actualExtraEndpoints);
        }
        expect(spy).toHaveBeenCalledTimes(1);
    }

    function getOpenApiJson(apis: string[]): object {
        const paths: Record<string, object> = {};
        for (const api of apis) {
            paths[api] = {
                get: {
                    tags: ["Api tag"],
                    responses: {
                        "200": {
                            description: "Success",
                            content: {
                                "application/json;charset=UTF-8": {
                                    schema: {
                                        type: "array",
                                        items: "string"
                                    }
                                }
                            }
                        }
                    }
                }
            };
        }

        return {
            openapi: "3.0.1",
            paths
        };
    }

    function expectBothContainsAll(arr1: string[], arr2: string[]): void {
        expect(arr1.every((c) => arr2.includes(c))).toBe(true);
        expect(arr2.every((c) => arr1.includes(c))).toBe(true);
    }
});
