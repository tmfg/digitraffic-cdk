import type { MonitoredApp } from "../app-props.js";
import axios from "axios";
import type { AppWithEndpoints } from "../model/app-with-endpoints.js";
import {
  logger,
  type LoggerMethodType,
} from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import _ from "lodash";

const BETA = "/beta/" as const;

export interface PathOperation {
  readonly parameters?: [{
    readonly name: string;
    readonly in: "query" | "header" | "path" | "cookie";
    readonly required: boolean;
    readonly schema: {
      default?: string[] | string;
    };
  }];
}

export interface PathItem {
  get?: PathOperation;
  post?: PathOperation;
  put?: PathOperation;
  patch?: PathOperation;
  delete?: PathOperation;
  head?: PathOperation;
  options?: PathOperation;
  trace?: PathOperation;
}

export interface OpenApiResponse {
  readonly paths: Record<string, PathItem>;
}

/**
 * Get endpoints form OpenApi spesification (OpenAPI Specification)
 */
export class DigitrafficApi {
  async getAppWithEndpoints(app: MonitoredApp): Promise<AppWithEndpoints> {
    const method =
      "DigitrafficApi.getAppEndpoints" as const satisfies LoggerMethodType;
    const start = Date.now();
    const message =
      `Fetch digitraffic endpoints for ${app.name} from ${app.url}` as const;
    logger.info({
      method,
      message,
    });
    // Swagger url
    return axios
      .get<OpenApiResponse>(app.url, {
        headers: {
          "accept-encoding": "gzip",
        },
        validateStatus: (status: number) => {
          return status === 200;
        },
      })
      .catch((reason) => {
        const errorMessage = `${message} failed with reason: ${
          JSON.stringify(reason)
        }`;
        logger.error({
          method,
          message: errorMessage,
        });
        throw new Error(`${method} ${message}`);
      })
      .then((resp) => {
        return this.createAppWithEndpointsResponse(app, resp.data);
      })
      .finally(() =>
        logger.info({
          method: method,
          message: `${message} done`,
          tookMs: Date.now() - start,
        })
      );
  }

  private createAppWithEndpointsResponse(
    app: MonitoredApp,
    resp: OpenApiResponse,
  ): AppWithEndpoints {
    const method =
      "DigitrafficApi.createEndpointResponse" as const satisfies LoggerMethodType;

    const apisToTest = Object.entries(resp.paths).map(
      ([path, item]) =>
        checkApiCanBeTestedAndAppendQueryStringToPath(path, item),
    ).filter((api) => api.canBeCalled)
      .map((api) => api.pathWithMaybeQueryString);

    const notBeta = apisToTest.filter((e) => !e.includes(BETA));
    const beta = apisToTest.filter((e) => e.includes(BETA));
    notBeta.sort();
    beta.sort();

    logger.info({
      method,
      customApiApp: app.name,
      message: `Found ${apisToTest.length}/${
        _.keys(resp.paths).length
      } Digitraffic endpoints to test`,
    });

    return {
      app: app.name,
      hostPart: app.hostPart,
      endpoints: ([] as string[])
        .concat(notBeta)
        .concat(beta)
        .filter((e) => !app.excluded.includes(e)),
      extraEndpoints: app.endpoints,
    } as const satisfies AppWithEndpoints;
  }
}

function checkApiCanBeTestedAndAppendQueryStringToPath(
  path: string,
  pathItem: PathItem,
): {
  readonly canBeCalled: boolean;
  readonly pathWithMaybeQueryString: string;
} {
  try {
    if (!pathItem.get) { // For now support only GET method
      logger.info({
        method: "DigitrafficApi.checkCanBeTestedAndGenerateQueryString",
        customPath: path,
        message: `Api can't be tested without GET method`,
      });
      return { canBeCalled: false, pathWithMaybeQueryString: path };
    }

    if (path.includes("{")) {
      logger.info({
        method: "DigitrafficApi.checkCanBeTestedAndGenerateQueryString",
        customPath: path,
        message: `Api can't be tested when there is path parameters`,
      });
      return { canBeCalled: false, pathWithMaybeQueryString: path };
    }

    if (path.includes("beta")) {
      logger.info({
        method: "DigitrafficApi.checkCanBeTestedAndGenerateQueryString",
        customPath: path,
        message: `Api can't be tested when its BETA`,
      });
      return { canBeCalled: false, pathWithMaybeQueryString: path };
    }

    const operation = pathItem.get;
    // No parameters or all are not required parameters -> ok to call
    if (
      !operation.parameters || !operation.parameters.find((p) => p.required)
    ) {
      logger.info({
        method: "DigitrafficApi.checkCanBeTestedAndGenerateQueryString",
        customPath: path,
        message: "Api can be tested without required parameters",
      });
      return { canBeCalled: true, pathWithMaybeQueryString: path };
    }

    // Can't call api with required parameters that doesn't have default value(s) defined
    if (
      operation.parameters.find((p) => p.required && !p.schema.default?.length)
    ) {
      logger.info({
        method: "DigitrafficApi.checkCanBeTestedAndGenerateQueryString",
        customPath: path,
        message:
          "Api can't be tested with required parameters without default parameters",
      });
      return { canBeCalled: false, pathWithMaybeQueryString: path };
    }

    // Now we have some required parameters with default values, lets parse them to query string
    // join result: param1=param1value1&param1=param1value2&param2=param2value1...
    logger.info({
      method: "DigitrafficApi.checkCanBeTestedAndGenerateQueryString",
      customPath: path,
      customOperationParameters: JSON.stringify(operation.parameters),
      message:
        "Api has some required parameters with default values, parsing queryString",
    });

    const queryString = operation.parameters
      .filter((p) => p.required && p.schema.default?.length)
      .map((p) => {
        if (Array.isArray(p.schema.default)) {
          return p.schema.default.map((paramValue) => `${p.name}=${paramValue}`)
            .join("&");
        } else {
          return `${p.name}=${p.schema.default}`;
        }
      })
      .join("&");

    logger.info({
      method: "DigitrafficApi.checkCanBeTestedAndGenerateQueryString",
      customPath: path,
      customQueryString: queryString,
      message: "Api can be tested with required parameters with default values",
    });
    return {
      canBeCalled: true,
      pathWithMaybeQueryString: `${path}${
        queryString ? "?" : ""
      }${queryString}`,
    };
  } catch (e) {
    logger.error({
      method: "DigitrafficApi.checkCanBeTestedAndGenerateQueryString",
      message: "Failed to check api defaulting to canBeCalled: false",
      customPathItem: JSON.stringify(pathItem),
      error: e,
    });
    return {
      canBeCalled: false,
      pathWithMaybeQueryString: path,
    };
  }
}
