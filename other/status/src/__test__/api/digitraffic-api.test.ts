import { TrafficType } from "@digitraffic/common/dist/types/traffictype";
import { jest } from "@jest/globals";
import ky, { type Input, type Options, type ResponsePromise } from "ky";
import type { PathItem } from "../../api/digitraffic-api.js";
import { DigitrafficApi } from "../../api/digitraffic-api.js";
import type { MonitoredApp, MonitoredEndpoint } from "../../app-props.js";
import { EndpointHttpMethod, EndpointProtocol } from "../../app-props.js";
import type { AppWithEndpoints } from "../../model/app-with-endpoints.js";

const SERVER_PORT = 8090;
const digitrafficApi = new DigitrafficApi();

const API_1 = "/api/maintenance/v1/tracking/domains" as const;
const API_2 = "/api/maintenance/v1/tracking/routes" as const;
const API_3 = "/api/maintenance/v1/tracking/latest" as const;
const API_4 = "/api/maintenance/v1/tracking/foo" as const;
const API_WITH_PATH_PARAMS =
  "/api/maintenance/v1/tracking/routes/{id}" as const;

describe("DigitrafficApiTest", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAppEndpoints - no exceptions", async () => {
    await getAppEndpointsAndExpect([API_1, API_2]);
  });

  test("getAppEndpoints - api with parameters excluded", async () => {
    await getAppEndpointsAndExpect(
      [API_1],
      convertToPathRecords([API_1, API_WITH_PATH_PARAMS]),
    );
  });

  test("getAppEndpoints - with exclude", async () => {
    await getAppEndpointsAndExpect(
      [API_1],
      convertToPathRecords([API_1, API_2]),
      [API_2],
    );
  });

  test("getAppEndpoints - with extra", async () => {
    await getAppEndpointsAndExpect(
      [API_1],
      convertToPathRecords([API_1]),
      [],
      [API_2],
    );
  });

  test("getAppEndpoints - with required parameters", async () => {
    const paths: Record<string, PathItem> = {};
    // Api 1 has required param so that will be filtered out
    paths[API_1] = {
      get: {
        parameters: [
          {
            name: "param1",
            required: true,
            in: "query",
            schema: {
              //default: []
            },
          },
        ],
      },
    };
    // Api 2 has array default values for required parameters, so it should be tested with query string
    paths[API_2] = {
      get: {
        parameters: [
          {
            name: "api2param1",
            required: true,
            in: "query",
            schema: {
              default: ["value1", "value2"],
            },
          },
        ],
      },
    };

    // Api 3 has optional parameters, so it should be tested
    paths[API_3] = {
      get: {
        parameters: [
          {
            name: "api3param1",
            required: false,
            in: "query",
            schema: {},
          },
        ],
      },
    };

    // Api 4 has default value for required parameter, so it should be tested with query string
    paths[API_4] = {
      get: {
        parameters: [
          {
            name: "api4param1",
            required: true,
            in: "query",
            schema: {
              default: "value1",
            },
          },
        ],
      },
    };

    const expectApi2WithParams = `${API_2}?api2param1=value1&api2param1=value2`;
    const expectApi4WithParams = `${API_4}?api4param1=value1`;
    await getAppEndpointsAndExpect(
      [expectApi2WithParams, API_3, expectApi4WithParams],
      paths,
    );
  });

  async function getAppEndpointsAndExpect(
    expectedApis: string[],
    apis: Record<string, PathItem> = convertToPathRecords(expectedApis),
    excluded: string[] = [],
    extraEndpoints: string[] = [],
  ): Promise<void> {
    const extraEndpointValues: MonitoredEndpoint[] = extraEndpoints.map(
      (e): MonitoredEndpoint => {
        return {
          name: e,
          url: e,
          protocol: EndpointProtocol.HTTP,
          method: EndpointHttpMethod.GET,
        };
      },
    );

    const monitoredApp = {
      name: TrafficType.ROAD,
      hostPart: "https://road",
      url: `http://localhost:${SERVER_PORT}/swagger/openapi.json`,
      excluded,
      endpoints: extraEndpointValues,
    } satisfies MonitoredApp;

    const spy = jest
      .spyOn(ky, "get")
      .mockImplementation(
        (_url: Input, _options: Options | undefined): ResponsePromise => {
          expect(_url).toEqual(monitoredApp.url);
          return Promise.resolve({
            status: 200,
            json: () => Promise.resolve(getOpenApiJson(apis)),
          }) as ResponsePromise;
        },
      );

    const appWithEndpoints: AppWithEndpoints =
      await digitrafficApi.getAppWithEndpoints(monitoredApp);

    expectBothContainsAll(expectedApis, appWithEndpoints.endpoints);

    if (extraEndpoints.length) {
      const actualExtraEndpoints = appWithEndpoints.extraEndpoints.map(
        (ep) => ep.url,
      );
      expectBothContainsAll(extraEndpoints, actualExtraEndpoints);
    }
    expect(spy).toHaveBeenCalledTimes(1);
  }

  function getOpenApiJson(apis: Record<string, PathItem>): object {
    const paths: Record<string, object> = {};

    console.debug(`apis: ${JSON.stringify(apis)}`);

    for (const api of Object.keys(apis)) {
      // @ts-expect-error
      const pathItem: PathItem = apis[api] satisfies PathItem;
      console.debug(`pathItem: ${JSON.stringify(pathItem)}`);
      paths[api] = {
        get: {
          ...pathItem.get,
          tags: ["Api tag"],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json;charset=UTF-8": {
                  schema: {
                    type: "array",
                    items: "string",
                  },
                },
              },
            },
          },
        },
      };
    }

    console.debug(`paths: ${JSON.stringify(paths)}`);
    return {
      openapi: "3.0.1",
      paths,
    };
  }

  function expectBothContainsAll(arr1: string[], arr2: string[]): void {
    expect(arr1.every((c) => arr2.includes(c))).toBe(true);
    expect(arr2.every((c) => arr1.includes(c))).toBe(true);
  }

  function convertToPathItem(api: string): PathItem {
    return {
      [api]: {
        get: {},
      },
    };
  }

  function convertToPathRecords(apis: string[]): Record<string, PathItem> {
    const result: Record<string, PathItem> = {};
    apis.forEach((a) => {
      result[a] = convertToPathItem(a);
    });
    return result;
  }
});
