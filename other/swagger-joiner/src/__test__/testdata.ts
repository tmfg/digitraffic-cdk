import type { OpenApiSchema } from "@digitraffic/common/dist/types/openapi-schema";
import { set } from "lodash-es";
import type { HttpMethod } from "../swagger-utils.js";

export const getOpenapiDescriptionWithPaths = (
  paths: OpenApiSchema["paths"],
): OpenApiSchema => ({
  openapi: "3.0.1",
  info: {
    title: "Digitraffic API",
    description: "liirum laarum",
    termsOfService: "https://www.digitraffic.fi/en/terms-of-service/",
    contact: {
      name: "Digitraffic / Fintraffic",
      url: "https://www.digitraffic.fi/",
    },
    license: {
      name: "Digitraffic is an open data service. All content from the service and the service documentation is licenced under the Creative Commons 4.0 BY license.",
      url: "https://creativecommons.org/licenses/by/4.0/",
    },
    version: "2.92.0-",
  },
  security: [{ api_key: [] }],
  paths,
});

export const getSupportedPath = (
  path: string,
  methods: HttpMethod[] = ["get"],
): OpenApiSchema["paths"] => {
  const methodRecords = Object.fromEntries(
    methods.map((m) => [
      m,
      {
        summary: `Api ${path} method ${m}`,
        description: `Description for api ${path} method ${m}`,
        responses: {
          "200": {
            description: "200 response",
            headers: {},
          },
        },
      },
    ]),
  );
  return {
    [path]: {
      ...methodRecords,
      ...{
        summary: `Summary for api ${path}`,
        description: `Description for api ${path}`,
      },
    },
  };
};

export function getPathWithSecurity(
  path: string,
  method: string = "get",
): OpenApiSchema["paths"] {
  const result = getSupportedPath(path);
  set<OpenApiSchema["paths"]>(
    result,
    [path, method, "security"],
    [
      {
        api_key: [],
      },
    ],
  );
  return result;
}

export const getDeprecatedPathWithHeaders = (
  path: string,
): OpenApiSchema["paths"] => ({
  [path]: {
    get: {
      summary: "Returns old data.",
      responses: {
        "200": {
          headers: {
            Sunset: {
              schema: {
                type: "string",
              },
            },
            "Access-Control-Allow-Origin": {
              schema: {
                type: "string",
              },
            },
            Deprecation: {
              schema: {
                type: "string",
              },
            },
          },
        },
      },
    },
  },
});

export const getDeprecatedPathWithRemovalText = (
  path: string,
): OpenApiSchema["paths"] => ({
  [path]: {
    get: {
      summary: "Also returns old data. Will be removed after 2023-06-01",
      responses: {
        "200": {
          headers: {},
        },
      },
    },
  },
});
