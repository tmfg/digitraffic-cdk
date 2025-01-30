/* eslint-disable max-lines */
export const TEST = {
  openapi: "3.0.1",
  info: {
    title: "Digitraffic Road API",
    description:
      '[OpenAPI document](/swagger/openapi.json) \n\nDigitraffic is a service operated by the [Fintraffic](https://www.fintraffic.fi) offering real time traffic information. Currently the service covers *road, marine and rail* traffic. More information can be found at the [Digitraffic website](https://www.digitraffic.fi/) \n\nThe service has a public Google-group [road.digitraffic.fi](https://groups.google.com/forum/#!forum/roaddigitrafficfi) for communication between developers, service administrators and Fintraffic. The discussion in the forum is mostly in Finnish, but you\'re welcome to communicate in English too. \n\n### General notes of the API\n* Many Digitraffic APIs use GeoJSON as data format. Definition of the GeoJSON format can be found at https://tools.ietf.org/html/rfc7946.\n* For dates and times [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format is used with "Zulu" zero offset from UTC unless otherwise specified (i.e., "yyyy-mm-ddThh:mm:ss[.mmm]Z"). E.g. 2019-11-01T06:30:00Z.',
    termsOfService: "https://www.digitraffic.fi/en/terms-of-service/",
    contact: {
      name: "Digitraffic / Fintraffic",
      url: "https://www.digitraffic.fi/",
    },
    license: {
      name:
        "Digitraffic is an open data service. All content from the service and the service documentation is licenced under the Creative Commons 4.0 BY license.",
      url: "https://creativecommons.org/licenses/by/4.0/",
    },
    version:
      "Branch: master, tag: 2023.12.11-1 #effbe05 @ 2023-12-11T13:22:14+0000",
  },
  servers: [{
    url: "https://tie-test.digitraffic.fi",
    variables: { basePath: { default: "prod" } },
  }],
  paths: {
    "/api/weathercam/v1/stations": {
      get: {
        tags: ["Weathercam V1"],
        summary: "The static information of weather camera stations",
        operationId: "weathercamStations",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description:
              "Successful retrieval of Camera Preset Feature Collections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeathercamStationFeatureCollectionSimpleV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeathercamStationFeatureCollectionSimpleV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeathercamStationFeatureCollectionSimpleV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weathercam/v1/stations/{id}": {
      get: {
        tags: ["Weathercam V1"],
        summary: "The static information of weather camera station",
        operationId: "weathercamStation",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Weathercam station id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeathercamStationFeatureV1Detailed",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeathercamStationFeatureV1Detailed",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeathercamStationFeatureV1Detailed",
                },
              },
            },
          },
        },
      },
    },
    "/api/weathercam/v1/stations/{id}/history": {
      get: {
        tags: ["Weathercam V1"],
        summary: "Weathercam presets history for given camera",
        operationId: "getWeathercamPresetsHistoryById",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Camera id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of weathercam image history",
            content: {
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/PresetHistory" },
              },
            },
          },
        },
      },
    },
    "/api/weathercam/v1/stations/{id}/data": {
      get: {
        tags: ["Weathercam V1"],
        summary: "Current data of weathercam",
        operationId: "weathercamDatasByStationId",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Camera station id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of camera station data",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/WeathercamStationDataV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weathercam/v1/stations/history": {
      get: {
        tags: ["Weathercam V1"],
        summary: "Weathercams presets history for all cameras",
        operationId: "getWeathercamsPresetsHistory",
        responses: {
          "200": {
            description: "Successful retrieval of weathercams image history",
            content: {
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/CameraHistory" },
              },
            },
          },
        },
      },
    },
    "/api/weathercam/v1/stations/data": {
      get: {
        tags: ["Weathercam V1"],
        summary: "Current data of weathercams",
        operationId: "weathercamsDatas",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of camera station data",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/WeathercamStationsDataV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weathercam/v1/publicities/changes": {
      get: {
        tags: ["Weathercam V1"],
        summary:
          "Weathercam presets publicity changes after given time. Result is in ascending order by presetId and lastModified -fields. ",
        operationId: "weathercamPresetPublicityChangesAfter",
        parameters: [
          {
            name: "after",
            in: "query",
            description:
              "Return changes int the history after given time. Given time must be within 24 hours. Default is 24h in past",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of camera history changes",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeathercamStationsPresetsPublicityHistoryV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/stations": {
      get: {
        tags: ["Weather V1"],
        summary: "The static information of weather stations",
        operationId: "weatherStations",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "state",
            in: "query",
            description: "Return weather stations of given state.",
            required: false,
            schema: { $ref: "#/components/schemas/RoadStationState" },
          },
        ],
        responses: {
          "200": {
            description:
              "Successful retrieval of weather Station Feature Collections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeatherStationFeatureCollectionSimpleV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeatherStationFeatureCollectionSimpleV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/WeatherStationFeatureCollectionSimpleV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/stations/{id}": {
      get: {
        tags: ["Weather V1"],
        summary: "The static information of one weather station",
        operationId: "weatherStationByRoadStationId",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", format: "int64" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of weather Station Feature",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/WeatherStationFeatureDetailedV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/WeatherStationFeatureDetailedV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/WeatherStationFeatureDetailedV1",
                },
              },
            },
          },
          "404": { description: "Road Station not found" },
        },
      },
    },
    "/api/weather/v1/stations/{id}/data": {
      get: {
        tags: ["Weather V1"],
        summary: "Current data of one weather station",
        operationId: "weatherDataById",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "TMS Station id",
            required: true,
            schema: { type: "integer", format: "int64" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of weather station data",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/WeatherStationDataDtoV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/stations/data": {
      get: {
        tags: ["Weather V1"],
        summary: "Current data of weather stations",
        operationId: "weatherData",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of weather station data",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/WeatherStationsDataDtoV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/sensors": {
      get: {
        tags: ["Weather V1"],
        summary:
          "The static information of available sensors of weather stations",
        operationId: "weatherSensors",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of weather station sensors",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/WeatherStationSensorsDtoV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/forecast-sections": {
      get: {
        tags: ["Weather V1"],
        summary: "The static information of weather forecast sections",
        operationId: "forecastSections",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "simplified",
            in: "query",
            description:
              "If parameter is given with true value, result geometry will be smaller in size.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "roadNumber",
            in: "query",
            description: "Road number",
            required: false,
            schema: { type: "integer", format: "int32" },
          },
          {
            name: "xMin",
            in: "query",
            description:
              "Minimum x coordinate (longitude) Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 19,
            },
          },
          {
            name: "yMin",
            in: "query",
            description:
              "Minimum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 59,
            },
          },
          {
            name: "xMax",
            in: "query",
            description:
              "Maximum x coordinate (longitude). Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 32,
            },
          },
          {
            name: "yMax",
            in: "query",
            description:
              "Maximum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 72,
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of Forecast Sections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/ForecastSectionFeatureCollectionV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/ForecastSectionFeatureCollectionV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/ForecastSectionFeatureCollectionV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/forecast-sections/{id}": {
      get: {
        tags: ["Weather V1"],
        summary: "The static information of weather forecast sections",
        operationId: "forecastSectionById",
        parameters: [
          {
            name: "simplified",
            in: "query",
            description:
              "If parameter is given with true value, result geometry will be smaller in size.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "id",
            in: "path",
            description: "Section id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of Forecast Sections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionFeatureV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionFeatureV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionFeatureV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/forecast-sections/{id}/forecasts": {
      get: {
        tags: ["Weather V1"],
        summary: "Current data of weather forecast sections",
        operationId: "forecastSectionForecastsById",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Section id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of Forecast Sections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionWeatherDtoV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionWeatherDtoV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionWeatherDtoV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/forecast-sections/forecasts": {
      get: {
        tags: ["Weather V1"],
        summary: "Current data of detailed weather forecast sections",
        operationId: "forecastSectionsForecasts",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "roadNumber",
            in: "query",
            description: "Road number",
            required: false,
            schema: { type: "integer", format: "int32" },
          },
          {
            name: "xMin",
            in: "query",
            description:
              "Minimum x coordinate (longitude) Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 19,
            },
          },
          {
            name: "yMin",
            in: "query",
            description:
              "Minimum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 59,
            },
          },
          {
            name: "xMax",
            in: "query",
            description:
              "Maximum x coordinate (longitude). Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 32,
            },
          },
          {
            name: "yMax",
            in: "query",
            description:
              "Maximum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 72,
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of Forecast Sections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionsWeatherDtoV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionsWeatherDtoV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionsWeatherDtoV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/forecast-sections-simple": {
      get: {
        tags: ["Weather V1"],
        summary: "The static information of simple weather forecast sections",
        operationId: "forecastSectionsSimple",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "roadNumber",
            in: "query",
            description: "Road number",
            required: false,
            schema: { type: "integer", format: "int32" },
          },
          {
            name: "xMin",
            in: "query",
            description:
              "Minimum x coordinate (longitude) Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 19,
            },
          },
          {
            name: "yMin",
            in: "query",
            description:
              "Minimum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 59,
            },
          },
          {
            name: "xMax",
            in: "query",
            description:
              "Maximum x coordinate (longitude). Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 32,
            },
          },
          {
            name: "yMax",
            in: "query",
            description:
              "Maximum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 72,
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of simple forecast sections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/ForecastSectionFeatureCollectionSimpleV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/ForecastSectionFeatureCollectionSimpleV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/ForecastSectionFeatureCollectionSimpleV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/forecast-sections-simple/{id}": {
      get: {
        tags: ["Weather V1"],
        summary: "The static information of simple weather forecast sections",
        operationId: "forecastSectionSimpleById",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Section id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of simple forecast sections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionFeatureSimpleV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionFeatureSimpleV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionFeatureSimpleV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/forecast-sections-simple/{id}/forecasts": {
      get: {
        tags: ["Weather V1"],
        summary: "Current data of simple weather forecast sections",
        operationId: "forecastSectionSimpleForecastsById",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Section id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of Forecast Sections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionWeatherDtoV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionWeatherDtoV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionWeatherDtoV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/weather/v1/forecast-sections-simple/forecasts": {
      get: {
        tags: ["Weather V1"],
        summary: "Current data of simple weather forecast sections",
        operationId: "forecastSectionsSimpleForecasts",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "roadNumber",
            in: "query",
            description: "Road number",
            required: false,
            schema: { type: "integer", format: "int32" },
          },
          {
            name: "xMin",
            in: "query",
            description:
              "Minimum x coordinate (longitude) Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 19,
            },
          },
          {
            name: "yMin",
            in: "query",
            description:
              "Minimum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 59,
            },
          },
          {
            name: "xMax",
            in: "query",
            description:
              "Maximum x coordinate (longitude). Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 32,
            },
          },
          {
            name: "yMax",
            in: "query",
            description:
              "Maximum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 72,
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of Forecast Sections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionsWeatherDtoV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionsWeatherDtoV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/ForecastSectionsWeatherDtoV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/variable-sign/v1/signs": {
      get: {
        tags: ["Variable Sign V1"],
        summary:
          "Return the latest data of variable signs. If deviceId is given, latest data for that sign will be returned, otherwise return the latest data for each sign from the last 7 days.",
        operationId: "variableSigns",
        parameters: [
          {
            name: "deviceId",
            in: "query",
            description:
              "If parameter is given list only latest value of given sign",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of variable sign data",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/VariableSignFeatureCollectionV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/variable-sign/v1/signs/{deviceId}": {
      get: {
        tags: ["Variable Sign V1"],
        summary: "Return the latest value of a variable sign",
        operationId: "variableSignByPath",
        parameters: [{
          name: "deviceId",
          in: "path",
          required: true,
          schema: { type: "string" },
        }],
        responses: {
          "200": {
            description: "Successful retrieval of variable sign data",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/VariableSignFeatureCollectionV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/variable-sign/v1/signs/history": {
      get: {
        tags: ["Variable Sign V1"],
        summary: "Return the history of variable sign data",
        operationId: "variableSignHistory",
        parameters: [
          {
            name: "deviceId",
            in: "query",
            description: "List history data of given sign",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of variable sign history",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/TrafficSignHistoryV1" },
                },
              },
            },
          },
        },
      },
    },
    "/api/variable-sign/v1/signs/code-descriptions": {
      get: {
        tags: ["Variable Sign V1"],
        summary: "Return all code descriptions.",
        operationId: "getCodeDescriptions",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/VariableSignDescriptions",
                },
              },
            },
          },
        },
      },
    },
    "/api/traffic-message/v1/messages": {
      get: {
        tags: ["Traffic message V1"],
        summary: "Active traffic messages as simple JSON",
        operationId: "trafficMessageSimple",
        parameters: [
          {
            name: "inactiveHours",
            in: "query",
            description:
              "Return traffic messages from given amount of hours in the past.",
            required: false,
            schema: { type: "integer", format: "int32", default: 0 },
          },
          {
            name: "includeAreaGeometry",
            in: "query",
            description:
              "If the parameter value is false, then the GeoJson geometry will be empty for announcements with area locations. Geometries for areas can be fetched from Traffic messages geometries for regions -api",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "situationType",
            in: "query",
            description: "Situation type.",
            required: true,
            schema: {
              type: "array",
              items: { $ref: "#/components/schemas/SituationTypeV1" },
              default: ["TRAFFIC_ANNOUNCEMENT"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of traffic messages",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TrafficAnnouncementFeatureCollectionV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TrafficAnnouncementFeatureCollectionV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TrafficAnnouncementFeatureCollectionV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/traffic-message/v1/messages/{situationId}": {
      get: {
        tags: ["Traffic message V1"],
        summary: "Traffic messages history by situation id as simple JSON",
        operationId: "trafficMessageSimpleBySituationId",
        parameters: [
          {
            name: "situationId",
            in: "path",
            description: "Situation id.",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "includeAreaGeometry",
            in: "query",
            description:
              "If the parameter value is false, then the GeoJson geometry will be empty for announcements with area locations. Geometries for areas can be fetched from Traffic messages geometries for regions -api",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "latest",
            in: "query",
            description:
              "If the parameter value is true, then only the latest message will be returned",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of traffic messages",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TrafficAnnouncementFeatureCollectionV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TrafficAnnouncementFeatureCollectionV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TrafficAnnouncementFeatureCollectionV1",
                },
              },
            },
          },
          "404": { description: "Situation id not found" },
        },
      },
    },
    "/api/traffic-message/v1/messages/{situationId}.datex2": {
      get: {
        tags: ["Traffic message V1"],
        summary: "Traffic messages by situationId as Datex2",
        operationId: "trafficMessageDatex2BySituationId",
        parameters: [
          {
            name: "situationId",
            in: "path",
            description: "Situation id.",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "latest",
            in: "query",
            description:
              "If the parameter value is true, then only the latest message will be returned otherwise all messages are returned",
            required: false,
            schema: { type: "boolean", default: true },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of traffic messages",
            content: {
              "application/xml;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/D2LogicalModel" },
              },
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/D2LogicalModel" },
              },
            },
          },
          "404": { description: "Situation id not found" },
        },
      },
    },
    "/api/traffic-message/v1/messages.datex2": {
      get: {
        tags: ["Traffic message V1"],
        summary: "Active traffic messages as Datex2",
        operationId: "trafficMessageDatex2",
        parameters: [
          {
            name: "inactiveHours",
            in: "query",
            description:
              "Return traffic messages from given amount of hours in the past.",
            required: false,
            schema: { type: "integer", format: "int32", default: 0 },
          },
          {
            name: "situationType",
            in: "query",
            description: "Situation type.",
            required: true,
            schema: {
              type: "array",
              items: { $ref: "#/components/schemas/SituationTypeV1" },
              default: ["TRAFFIC_ANNOUNCEMENT"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of traffic messages",
            content: {
              "application/xml;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/D2LogicalModel" },
              },
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/D2LogicalModel" },
              },
            },
          },
        },
      },
    },
    "/api/traffic-message/v1/locations": {
      get: {
        tags: ["Traffic message V1"],
        summary: "The static information of locations",
        operationId: "locations",
        parameters: [
          {
            name: "version",
            in: "query",
            description: "If parameter is given use this version.",
            required: false,
            schema: { type: "string", default: "latest" },
          },
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of locations",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/LocationFeatureCollectionV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/LocationFeatureCollectionV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/LocationFeatureCollectionV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/traffic-message/v1/locations/{id}": {
      get: {
        tags: ["Traffic message V1"],
        summary: "The static information of one location",
        operationId: "locationById",
        parameters: [
          {
            name: "version",
            in: "query",
            description: "If parameter is given use this version.",
            required: false,
            schema: { type: "string", default: "latest" },
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", format: "int32" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of location",
            content: {
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/LocationFeatureV1" },
              },
              "application/geo+json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/LocationFeatureV1" },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/LocationFeatureV1" },
              },
            },
          },
        },
      },
    },
    "/api/traffic-message/v1/locations/versions": {
      get: {
        tags: ["Traffic message V1"],
        summary: "List available location versions",
        operationId: "locationVersions",
        responses: {
          "200": {
            description: "Successful retrieval of location versions",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/LocationVersionDtoV1" },
                },
              },
            },
          },
        },
      },
    },
    "/api/traffic-message/v1/locations/types": {
      get: {
        tags: ["Traffic message V1"],
        summary:
          "The static information of location types and locationsubtypes",
        operationId: "locationTypes",
        parameters: [
          {
            name: "version",
            in: "query",
            description: "If parameter is given use this version.",
            required: false,
            schema: { type: "string", default: "latest" },
          },
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description:
              "Successful retrieval of location types and location subtypes",
            content: {
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/LocationTypesDtoV1" },
              },
            },
          },
        },
      },
    },
    "/api/traffic-message/v1/area-geometries": {
      get: {
        tags: ["Traffic message V1"],
        summary: "Traffic messages geometries for regions",
        operationId: "areaLocationRegions",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If the parameter value is true, then the result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: true },
          },
          {
            name: "includeGeometry",
            in: "query",
            description:
              "If the parameter value is false, then the result will not contain also geometries.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "effectiveDate",
            in: "query",
            description:
              "When effectiveDate parameter is given only effective geometries on that date are returned",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of geometries",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/RegionGeometryFeatureCollectionV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/RegionGeometryFeatureCollectionV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/RegionGeometryFeatureCollectionV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/traffic-message/v1/area-geometries/{locationCode}": {
      get: {
        tags: ["Traffic message V1"],
        summary: "Traffic messages geometries for regions",
        operationId: "areaLocationRegions_1",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If the parameter value is true, then the result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "includeGeometry",
            in: "query",
            description:
              "If the parameter value is false, then the result will not contain also geometries.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "effectiveDate",
            in: "query",
            description:
              "When effectiveDate parameter is given only effective geometries on that date are returned",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "locationCode",
            in: "path",
            description: "Location code id",
            required: true,
            schema: { type: "integer", format: "int32" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of geometries",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/RegionGeometryFeatureCollectionV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/RegionGeometryFeatureCollectionV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/RegionGeometryFeatureCollectionV1",
                },
              },
            },
          },
          "404": { description: "Geometry not not found" },
        },
      },
    },
    "/api/tms/v1/stations": {
      get: {
        tags: ["TMS V1"],
        summary:
          "The static information of TMS stations (Traffic Measurement System / LAM)",
        operationId: "tmsStations",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
          {
            name: "state",
            in: "query",
            description: "Return TMS stations of given state.",
            required: false,
            schema: { $ref: "#/components/schemas/RoadStationState" },
          },
        ],
        responses: {
          "200": {
            description:
              "Successful retrieval of TMS Station Feature Collections",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TmsStationFeatureCollectionSimpleV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TmsStationFeatureCollectionSimpleV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TmsStationFeatureCollectionSimpleV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/tms/v1/stations/{id}": {
      get: {
        tags: ["TMS V1"],
        summary:
          "The static information of one TMS station (Traffic Measurement System / LAM)",
        operationId: "tmsStationByRoadStationId",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", format: "int64" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of TMS Station Feature",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/TmsStationFeatureDetailedV1",
                },
              },
              "application/geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/TmsStationFeatureDetailedV1",
                },
              },
              "application/vnd.geo+json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/TmsStationFeatureDetailedV1",
                },
              },
            },
          },
          "404": { description: "Road Station not found" },
        },
      },
    },
    "/api/tms/v1/stations/{id}/sensor-constants": {
      get: {
        tags: ["TMS V1"],
        summary:
          "Current sensor constants and values of one TMS station (Traffic Measurement System / LAM)",
        operationId: "tmsSensorConstantsByStationId",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "TMS Station id",
            required: true,
            schema: { type: "integer", format: "int64" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of sensor constants and values",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/TmsStationSensorConstantDtoV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/tms/v1/stations/{id}/data": {
      get: {
        tags: ["TMS V1"],
        summary:
          "Current data of one TMS station (Traffic Measurement System / LAM)",
        operationId: "tmsDataById",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "TMS Station id",
            required: true,
            schema: { type: "integer", format: "int64" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of TMS station data",
            content: {
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/TmsStationDataDtoV1" },
              },
            },
          },
        },
      },
    },
    "/api/tms/v1/stations/sensor-constants": {
      get: {
        tags: ["TMS V1"],
        summary:
          "Current sensor constants and values of TMS stations (Traffic Measurement System / LAM)",
        operationId: "tmsSensorConstants",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of sensor constants and values",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/TmsStationsSensorConstantsDataDtoV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/tms/v1/stations/data": {
      get: {
        tags: ["TMS V1"],
        summary:
          "Current data of TMS stations (Traffic Measurement System / LAM)",
        operationId: "tmsData",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of TMS station data",
            content: {
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/TmsStationsDataDtoV1" },
              },
            },
          },
        },
      },
    },
    "/api/tms/v1/sensors": {
      get: {
        tags: ["TMS V1"],
        summary:
          "The static information of available sensors of TMS stations (Traffic Measurement System / LAM)",
        operationId: "tmsSensors",
        parameters: [
          {
            name: "lastUpdated",
            in: "query",
            description:
              "If parameter is given result will only contain update status.",
            required: false,
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of TMS station sensors",
            content: {
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/TmsStationSensorsDtoV1" },
              },
            },
          },
        },
      },
    },
    "/api/maintenance/v1/tracking/tasks": {
      get: {
        tags: ["Maintenance V1"],
        summary: "Road maintenance tracking tasks",
        operationId: "getMaintenanceTrackingTasks",
        responses: {
          "200": {
            description: "Successful retrieval of maintenance tracking tasks",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/MaintenanceTrackingTaskDtoV1",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/maintenance/v1/tracking/routes": {
      get: {
        tags: ["Maintenance V1"],
        summary: "Road maintenance tracking routes",
        operationId: "findMaintenanceTrackings",
        parameters: [
          {
            name: "endFrom",
            in: "query",
            description:
              "Return routes which have completed onwards from the given time (inclusive). Default is 24h in past and maximum interval between from and to is 24h.",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "endBefore",
            in: "query",
            description:
              "Return routes which have completed before the given end time (exclusive). Default is now and maximum interval between from and to is 24h.",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "createdAfter",
            in: "query",
            description:
              "Return routes which have been created after the given time (exclusive). Maximum interval between createdFrom and createdTo is 24h.",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "createdBefore",
            in: "query",
            description:
              "Return routes which have been created before the given time (exclusive). Maximum interval between createdFrom and createdTo is 24h.",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "xMin",
            in: "query",
            description:
              "Minimum x coordinate (longitude) Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.<br>xMin coordinate will be rounded to nearest integer that is less than or equal to given value",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 19,
            },
          },
          {
            name: "yMin",
            in: "query",
            description:
              "Minimum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.<br>yMin coordinate will be rounded to nearest half that is less than or equal to given value",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 59,
            },
          },
          {
            name: "xMax",
            in: "query",
            description:
              "Maximum x coordinate (longitude). Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.<br>xMax coordinate will be rounded to nearest integer greater than or equal to given value",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 32,
            },
          },
          {
            name: "yMax",
            in: "query",
            description:
              "Maximum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.<br>yMax coordinate will be rounded to nearest half that is greater than or equal to given value",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 72,
            },
          },
          {
            name: "taskId",
            in: "query",
            description:
              "Task ids to include. Any tracking containing one of the selected tasks will be returned.",
            required: false,
            schema: {
              uniqueItems: true,
              type: "array",
              items: {
                type: "string",
                enum: [
                  "BRUSHING",
                  "BRUSH_CLEARING",
                  "CLEANSING_OF_BRIDGES",
                  "CLEANSING_OF_REST_AREAS",
                  "CLEANSING_OF_TRAFFIC_SIGNS",
                  "CLIENTS_QUALITY_CONTROL",
                  "COMPACTION_BY_ROLLING",
                  "CRACK_FILLING",
                  "DITCHING",
                  "DUST_BINDING_OF_GRAVEL_ROAD_SURFACE",
                  "FILLING_OF_GRAVEL_ROAD_SHOULDERS",
                  "FILLING_OF_ROAD_SHOULDERS",
                  "HEATING",
                  "LEVELLING_GRAVEL_ROAD_SURFACE",
                  "LEVELLING_OF_ROAD_SHOULDERS",
                  "LEVELLING_OF_ROAD_SURFACE",
                  "LINE_SANDING",
                  "LOWERING_OF_SNOWBANKS",
                  "MAINTENANCE_OF_GUIDE_SIGNS_AND_REFLECTOR_POSTS",
                  "MECHANICAL_CUT",
                  "MIXING_OR_STABILIZATION",
                  "OTHER",
                  "PATCHING",
                  "PAVING",
                  "PLOUGHING_AND_SLUSH_REMOVAL",
                  "PREVENTING_MELTING_WATER_PROBLEMS",
                  "REMOVAL_OF_BULGE_ICE",
                  "RESHAPING_GRAVEL_ROAD_SURFACE",
                  "ROAD_INSPECTIONS",
                  "ROAD_MARKINGS",
                  "ROAD_STATE_CHECKING",
                  "SAFETY_EQUIPMENT",
                  "SALTING",
                  "SNOW_PLOUGHING_STICKS_AND_SNOW_FENCES",
                  "SPOT_SANDING",
                  "SPREADING_OF_CRUSH",
                  "TRANSFER_OF_SNOW",
                  "UNKNOWN",
                ],
              },
            },
          },
          {
            name: "domain",
            in: "query",
            description:
              'Data domains. If domain is not given default value of "state-roads" will be used.',
            required: false,
            schema: {
              uniqueItems: true,
              type: "array",
              items: { type: "string" },
              default: ["state-roads"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of maintenance tracking routes",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/MaintenanceTrackingFeatureCollectionV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/maintenance/v1/tracking/routes/{id}": {
      get: {
        tags: ["Maintenance V1"],
        summary: "Road maintenance tracking route with tracking id",
        operationId: "getMaintenanceTracking",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Tracking id",
            required: true,
            schema: { type: "integer", format: "int64" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of maintenance tracking routes",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref: "#/components/schemas/MaintenanceTrackingFeatureV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/maintenance/v1/tracking/routes/latest": {
      get: {
        tags: ["Maintenance V1"],
        summary: "Road maintenance tracking routes latest points",
        operationId: "findLatestMaintenanceTrackings",
        parameters: [
          {
            name: "endFrom",
            in: "query",
            description:
              "Return routes which have completed onwards from the given time (inclusive). Default is -1h from now and maximum -24h.",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "xMin",
            in: "query",
            description:
              "Minimum x coordinate (longitude) Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.<br>xMin coordinate will be rounded to nearest integer that is less than or equal to given value",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 19,
            },
          },
          {
            name: "yMin",
            in: "query",
            description:
              "Minimum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.<br>yMin coordinate will be rounded to nearest half that is less than or equal to given value",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 59,
            },
          },
          {
            name: "xMax",
            in: "query",
            description:
              "Maximum x coordinate (longitude). Coordinates are in WGS84 format in decimal degrees. Values between 19.0 and 32.0.<br>xMax coordinate will be rounded to nearest integer greater than or equal to given value",
            required: false,
            schema: {
              maximum: 32,
              exclusiveMaximum: false,
              minimum: 19,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 32,
            },
          },
          {
            name: "yMax",
            in: "query",
            description:
              "Maximum y coordinate (latitude). Coordinates are in WGS84 format in decimal degrees. Values between 59.0 and 72.0.<br>yMax coordinate will be rounded to nearest half that is greater than or equal to given value",
            required: false,
            schema: {
              maximum: 72,
              exclusiveMaximum: false,
              minimum: 59,
              exclusiveMinimum: false,
              type: "number",
              format: "double",
              default: 72,
            },
          },
          {
            name: "taskId",
            in: "query",
            description:
              "Task ids to include. Any route containing one of the selected tasks will be returned.",
            required: false,
            schema: {
              uniqueItems: true,
              type: "array",
              items: {
                type: "string",
                enum: [
                  "BRUSHING",
                  "BRUSH_CLEARING",
                  "CLEANSING_OF_BRIDGES",
                  "CLEANSING_OF_REST_AREAS",
                  "CLEANSING_OF_TRAFFIC_SIGNS",
                  "CLIENTS_QUALITY_CONTROL",
                  "COMPACTION_BY_ROLLING",
                  "CRACK_FILLING",
                  "DITCHING",
                  "DUST_BINDING_OF_GRAVEL_ROAD_SURFACE",
                  "FILLING_OF_GRAVEL_ROAD_SHOULDERS",
                  "FILLING_OF_ROAD_SHOULDERS",
                  "HEATING",
                  "LEVELLING_GRAVEL_ROAD_SURFACE",
                  "LEVELLING_OF_ROAD_SHOULDERS",
                  "LEVELLING_OF_ROAD_SURFACE",
                  "LINE_SANDING",
                  "LOWERING_OF_SNOWBANKS",
                  "MAINTENANCE_OF_GUIDE_SIGNS_AND_REFLECTOR_POSTS",
                  "MECHANICAL_CUT",
                  "MIXING_OR_STABILIZATION",
                  "OTHER",
                  "PATCHING",
                  "PAVING",
                  "PLOUGHING_AND_SLUSH_REMOVAL",
                  "PREVENTING_MELTING_WATER_PROBLEMS",
                  "REMOVAL_OF_BULGE_ICE",
                  "RESHAPING_GRAVEL_ROAD_SURFACE",
                  "ROAD_INSPECTIONS",
                  "ROAD_MARKINGS",
                  "ROAD_STATE_CHECKING",
                  "SAFETY_EQUIPMENT",
                  "SALTING",
                  "SNOW_PLOUGHING_STICKS_AND_SNOW_FENCES",
                  "SPOT_SANDING",
                  "SPREADING_OF_CRUSH",
                  "TRANSFER_OF_SNOW",
                  "UNKNOWN",
                ],
              },
            },
          },
          {
            name: "domain",
            in: "query",
            description:
              'Data domains. If domain is not given default value of "state-roads" will be used.',
            required: false,
            schema: {
              uniqueItems: true,
              type: "array",
              items: { type: "string" },
              default: ["state-roads"],
            },
          },
        ],
        responses: {
          "200": {
            description:
              "Successful retrieval of maintenance tracking latest routes",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  $ref:
                    "#/components/schemas/MaintenanceTrackingLatestFeatureCollectionV1",
                },
              },
            },
          },
        },
      },
    },
    "/api/maintenance/v1/tracking/domains": {
      get: {
        tags: ["Maintenance V1"],
        summary: "Road maintenance tracking domains",
        operationId: "getMaintenanceTrackingDomains",
        responses: {
          "200": {
            description: "Successful retrieval of maintenance tracking domains",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/MaintenanceTrackingDomainDtoV1",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/info/v1/update-times": {
      get: {
        tags: ["Info V1"],
        summary: "Infos about apis data update times",
        description:
          "This API returns info about data update intervals, when data is last updated and how often should API to be called by client. \nFor `dataUpdateInterval` field the `P0S` value has special meaning that data is updated nearly in real time. \n`null` value indicates static data and it is only updated when needed.",
        operationId: "dataUpdatedInfos",
        responses: {
          "200": {
            description:
              "Successful retrieval of weather Station Feature Collections",
            content: {
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/UpdateInfosDtoV1" },
              },
            },
          },
        },
      },
    },
    "/api/counting-site/v1/user-types": {
      get: {
        tags: ["Counting site V1"],
        summary: "Return all user types",
        responses: {
          "200": {
            description: "200 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserTypesResponseModel" },
              },
            },
          },
          "500": {
            description: "500 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Empty" },
              },
            },
          },
        },
        security: [{ api_key: [] }],
      },
    },
    "/api/counting-site/v1/values.csv": {
      get: {
        tags: ["Counting site V1"],
        summary:
          "Return counter values in CSV. If no year&month specified, current month will be used",
        parameters: [
          {
            name: "year",
            in: "query",
            description: "Year",
            schema: { type: "string" },
          },
          {
            name: "domain_name",
            in: "query",
            description: "Domain name",
            schema: { type: "string" },
          },
          {
            name: "counter_id",
            in: "query",
            description: "Counter id",
            schema: { type: "string" },
          },
          {
            name: "month",
            in: "query",
            description: "Month",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "200 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "text/csv": {
                schema: { $ref: "#/components/schemas/CSVDataModel" },
              },
            },
          },
          "500": {
            description: "500 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Empty" },
              },
            },
          },
        },
        security: [{ api_key: [] }],
      },
    },
    "/api/counting-site/v1/domains": {
      get: {
        tags: ["Counting site V1"],
        summary: "Return all domains",
        responses: {
          "200": {
            description: "200 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DomainsResponseModel" },
              },
            },
          },
          "500": {
            description: "500 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Empty" },
              },
            },
          },
        },
        security: [{ api_key: [] }],
      },
    },
    "/api/counting-site/v1/values": {
      get: {
        tags: ["Counting site V1"],
        summary:
          "Return counter values.  If no year&month specified, current month will be used.",
        parameters: [
          {
            name: "year",
            in: "query",
            description: "Year",
            schema: { type: "string" },
          },
          {
            name: "domain_name",
            in: "query",
            description: "Domain name",
            schema: { type: "string" },
          },
          {
            name: "counter_id",
            in: "query",
            description: "Counter id",
            schema: { type: "string" },
          },
          {
            name: "month",
            in: "query",
            description: "Month",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "200 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/JsonDataResponseModel" },
              },
            },
          },
          "500": {
            description: "500 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Empty" },
              },
            },
          },
        },
        security: [{ api_key: [] }],
      },
    },
    "/api/counting-site/v1/counters": {
      get: {
        tags: ["Counting site V1"],
        summary: "Return all counters for domain",
        parameters: [
          {
            name: "domain_name",
            in: "query",
            description: "Domain name",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "200 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/geo+json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/CountersModel" },
              },
            },
          },
          "500": {
            description: "500 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Empty" },
              },
            },
          },
        },
        security: [{ api_key: [] }],
      },
    },
    "/api/counting-site/v1/counters/{counterId}": {
      get: {
        tags: ["Counting site V1"],
        summary: "Return single counter",
        parameters: [{
          name: "counterId",
          in: "path",
          required: true,
          schema: { type: "string" },
        }],
        responses: {
          "200": {
            description: "200 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/geo+json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/CountersModel" },
              },
            },
          },
          "500": {
            description: "500 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Empty" },
              },
            },
          },
        },
        security: [{ api_key: [] }],
      },
    },
    "/api/counting-site/v1/directions": {
      get: {
        tags: ["Counting site V1"],
        summary: "Return all directions",
        responses: {
          "200": {
            description: "200 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {},
          },
        },
        security: [{ api_key: [] }],
      },
    },
    "/api/variable-sign/v1/images/{text}": {
      get: {
        tags: ["Variable Sign V1"],
        summary: "Generate svg-image from given text",
        parameters: [{
          name: "text",
          in: "path",
          required: true,
          schema: { type: "string" },
        }],
        responses: {
          "200": {
            description: "200 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "image/svg+xml": {
                schema: { $ref: "#/components/schemas/SvgModel" },
              },
            },
          },
          "400": {
            description: "400 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Empty" },
              },
            },
          },
          "500": {
            description: "500 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Empty" },
              },
            },
          },
        },
        security: [{ api_key: [] }],
      },
    },
    "/api/variable-sign/v1/signs.datex2": {
      get: {
        tags: ["Variable Sign V1"],
        summary: "Return all variables signs as datex2",
        responses: {
          "200": {
            description: "200 response",
            headers: {
              "Access-Control-Allow-Origin": { schema: { type: "string" } },
            },
            content: {
              "application/xml": {
                schema: { $ref: "#/components/schemas/XmlModel" },
              },
            },
          },
        },
        security: [{ api_key: [] }],
      },
    },
    "/api/beta/weather-history-data/{stationId}": {
      get: {
        tags: ["Beta"],
        summary:
          "List the history of sensor values from the weather road station",
        operationId: "weatherDataHistory",
        parameters: [
          {
            name: "stationId",
            in: "path",
            description: "Weather station id",
            required: true,
            schema: { type: "integer", format: "int64" },
          },
          {
            name: "from",
            in: "query",
            description: "Fetch history after given date time",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "to",
            in: "query",
            description: "Limit history to given date time",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of weather station data",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/WeatherSensorValueHistoryDto",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid parameter(s)" },
        },
      },
    },
    "/api/beta/weather-history-data/{stationId}/{sensorId}": {
      get: {
        tags: ["Beta"],
        summary:
          "List the history of sensor value from the weather road station",
        operationId: "weatherDataHistory_1",
        parameters: [
          {
            name: "stationId",
            in: "path",
            description: "Weather Station id",
            required: true,
            schema: { type: "integer", format: "int64" },
          },
          {
            name: "sensorId",
            in: "path",
            description: "Sensor id",
            required: true,
            schema: { type: "integer", format: "int64" },
          },
          {
            name: "from",
            in: "query",
            description: "Fetch history after given time",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of weather station data",
            content: {
              "application/json;charset=UTF-8": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/WeatherSensorValueHistoryDto",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid parameter" },
        },
      },
    },
    "/api/beta/tms-stations-datex2": {
      get: {
        tags: ["Beta"],
        summary:
          "The static information of TMS stations in Datex2 format (Traffic Measurement System / LAM)",
        operationId: "tmsStationsDatex2",
        parameters: [
          {
            name: "state",
            in: "query",
            description: "Return TMS stations of given state.",
            required: false,
            schema: { $ref: "#/components/schemas/RoadStationState" },
          },
        ],
        responses: {
          "200": {
            description: "Successful retrieval of TMS Stations Datex2 metadata",
            content: {
              "application/xml;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/D2LogicalModel" },
              },
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/D2LogicalModel" },
              },
            },
          },
        },
      },
    },
    "/api/beta/tms-data-datex2": {
      get: {
        tags: ["Beta"],
        summary:
          "Current data of TMS Stations in Datex2 format (Traffic Measurement System / LAM)",
        operationId: "tmsDataDatex2",
        responses: {
          "200": {
            description: "Successful retrieval of TMS Stations Datex2 data",
            content: {
              "application/xml;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/D2LogicalModel" },
              },
              "application/json;charset=UTF-8": {
                schema: { $ref: "#/components/schemas/D2LogicalModel" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Point: {
        required: ["coordinates", "type"],
        type: "object",
        description: "GeoJson Point Geometry Object",
        allOf: [
          { $ref: "#/components/schemas/GeometryObject" },
          {
            type: "object",
            properties: {
              type: { type: "string", example: "Point", enum: ["Point"] },
              coordinates: {
                type: "array",
                description:
                  "An array of coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                example: [26.97677492, 65.3467385],
                items: {
                  type: "number",
                  description:
                    "An array of coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                  format: "double",
                },
              },
            },
          },
        ],
      },
      WeathercamPresetSimpleV1: {
        type: "object",
        properties: {
          id: { type: "string", description: "Id of preset" },
          inCollection: {
            type: "boolean",
            description: "Is preset in collection",
          },
        },
        description: "Weathercam preset object with basic information",
      },
      WeathercamStationFeatureCollectionSimpleV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: {
              $ref: "#/components/schemas/WeathercamStationFeatureSimpleV1",
            },
          },
        },
        description:
          "Weathercam GeoJSON FeatureCollection object with basic information",
      },
      WeathercamStationFeatureSimpleV1: {
        required: ["geometry", "id", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          id: { type: "string", description: "Id of the road station" },
          geometry: { $ref: "#/components/schemas/Point" },
          properties: {
            $ref: "#/components/schemas/WeathercamStationPropertiesSimpleV1",
          },
        },
        description:
          "Weathercam station GeoJSON Feature object with basic information",
      },
      WeathercamStationPropertiesSimpleV1: {
        required: ["id"],
        type: "object",
        properties: {
          id: { type: "string", description: "Id of the road station" },
          name: { type: "string", description: "Common name of road station" },
          collectionStatus: {
            type: "string",
            description: "Data collection status",
            enum: ["GATHERING", "REMOVED_TEMPORARILY", "REMOVED_PERMANENTLY"],
          },
          state: {
            type: "string",
            description: "Road station state",
            enum: [
              "OK",
              "OK_FAULT_DOUBT_CANCELLED",
              "FAULT_DOUBT",
              "FAULT_CONFIRMED",
              "FAULT_CONFIRMED_NOT_FIXED_IN_NEAR_FUTURE",
              "REPAIR_REQUEST_POSTED",
              "REPAIR_MAINTENANCE_DONE",
              "REPAIR_INTERRUPTED",
            ],
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          presets: {
            type: "array",
            description: "Weathercam presets",
            items: { $ref: "#/components/schemas/WeathercamPresetSimpleV1" },
          },
        },
        description:
          "Weathercam station properties object with basic information",
      },
      StationRoadAddressV1: {
        type: "object",
        properties: {
          roadNumber: {
            type: "integer",
            description: "Road number (values 1–99999)",
            format: "int32",
            example: 7,
          },
          roadSection: {
            type: "integer",
            description: "Road section (values 1–999)",
            format: "int32",
            example: 8,
          },
          distanceFromRoadSectionStart: {
            type: "integer",
            description: "Distance from start of the road portion [m]",
            format: "int32",
            example: 3801,
          },
          carriageway: {
            type: "string",
            description:
              "Carriageway <br>ONE_CARRIAGEWAY:                                0 = One carriageway road section <br>DUAL_CARRIAGEWAY_RIGHT_IN_INCREASING_DIRECTION: 1 = Dual carriageway's right carriageway on increasing direction <br>DUAL_CARRIAGEWAY_LEFT_IN_INCREASING_DIRECTION:  2 = Dual carriageway's left carriageway on increasing direction (upstream)",
            enum: [
              "ONE_CARRIAGEWAY",
              "DUAL_CARRIAGEWAY_RIGHT_IN_INCREASING_DIRECTION",
              "DUAL_CARRIAGEWAY_LEFT_IN_INCREASING_DIRECTION",
            ],
          },
          side: {
            type: "string",
            description:
              "Road address side information <br>* UNKNOWN: 0 = Unknown, <br>* RIGHT    1 = On the right side of the carriageway in the increasing direction, <br>* LEFT:    2 = On the left side of the carriageway in the increasing direction, <br>* BETWEEN: 3 = Between the carriageways, <br>* END:     7 = At the end of the road, <br>* MIDDLE:  8 = In the middle of the carriageway / on the carriageway, <br>* CROSS:   9 = Across the road",
            enum: [
              "UNKNOWN",
              "RIGHT",
              "LEFT",
              "BETWEEN",
              "END",
              "MIDDLE",
              "CROSS",
            ],
          },
          contractArea: {
            type: "string",
            description: "Road contract area",
            example: "Espoo 19-24",
          },
          contractAreaCode: {
            type: "integer",
            description: "Road contract area code",
            format: "int32",
            example: 142,
          },
        },
        description: "Road station road address",
      },
      WeathercamPresetDetailedV1: {
        required: ["direction", "directionCode"],
        type: "object",
        properties: {
          id: { type: "string", description: "Id of preset" },
          presentationName: {
            type: "string",
            description: "PresentationName (Preset name 1, direction)",
          },
          inCollection: {
            type: "boolean",
            description: "Is preset in collection",
          },
          resolution: {
            type: "string",
            description: "Resolution of camera [px x px]",
          },
          directionCode: {
            type: "string",
            description:
              "Preset direction:<br>\n0 = Unknown direction.<br>\n1 = According to the road register address increasing direction. I.e. on the road 4 to Lahti, if we are in Korso.<br>\n2 = According to the road register address decreasing direction. I.e. on the road 4 to Helsinki, if we are in Korso.<br>\n3 = Increasing direction of the crossing road.<br>\n4 = Decreasing direction of the crossing road.<br>\n5-99 = Special directions",
          },
          imageUrl: { type: "string", description: "Image url" },
          direction: {
            $ref: "#/components/schemas/WeathercamPresetDirectionV1",
          },
        },
        description: "Weathercam preset object with detailed information",
      },
      WeathercamPresetDirectionV1: {
        type: "string",
        description: "Weathercam preset direction",
        default: "UNKNOWN",
        enum: [
          "UNKNOWN",
          "INCREASING_DIRECTION",
          "DECREASING_DIRECTION",
          "CROSSING_ROAD_INCREASING_DIRECTION",
          "CROSSING_ROAD_DECREASING_DIRECTION",
          "SPECIAL_DIRECTION",
        ],
      },
      WeathercamStationFeatureV1Detailed: {
        required: ["geometry", "id", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          id: { type: "string", description: "Id of the road station" },
          geometry: { $ref: "#/components/schemas/Point" },
          properties: {
            $ref: "#/components/schemas/WeathercamStationPropertiesDetailedV1",
          },
        },
        description:
          " Weathercam station GeoJSON feature object with detailed information",
      },
      WeathercamStationPropertiesDetailedV1: {
        required: ["id"],
        type: "object",
        properties: {
          id: { type: "string", description: "Id of the road station" },
          name: { type: "string", description: "Common name of road station" },
          cameraType: {
            type: "string",
            description: "Type of camera",
            enum: [
              "VAPIX",
              "VMX_MPC",
              "VMX_MPH",
              "D_LINK",
              "ZAVIO",
              "ENEO",
              "BOSCH",
              "SONY",
              "HIKVISION",
              "OLD",
            ],
          },
          nearestWeatherStationId: {
            type: "integer",
            description: "Nearest weather station id",
            format: "int64",
          },
          collectionStatus: {
            type: "string",
            description: "Data collection status",
            enum: ["GATHERING", "REMOVED_TEMPORARILY", "REMOVED_PERMANENTLY"],
          },
          state: {
            type: "string",
            description: "Road station state",
            enum: [
              "OK",
              "OK_FAULT_DOUBT_CANCELLED",
              "FAULT_DOUBT",
              "FAULT_CONFIRMED",
              "FAULT_CONFIRMED_NOT_FIXED_IN_NEAR_FUTURE",
              "REPAIR_REQUEST_POSTED",
              "REPAIR_MAINTENANCE_DONE",
              "REPAIR_INTERRUPTED",
            ],
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          collectionInterval: {
            type: "integer",
            description: "Data collection interval [s]",
            format: "int32",
          },
          names: {
            type: "object",
            additionalProperties: {
              type: "string",
              description: "Map of names [fi, sv, en]",
              example:
                '{"fi":"Tie 7 Porvoo, Harabacka","sv":"Väg 7 Borgå, Harabacka","en":"Road 7 Porvoo, Harabacka"}',
            },
            description: "Map of names [fi, sv, en]",
            example: {
              fi: "Tie 7 Porvoo, Harabacka",
              sv: "Väg 7 Borgå, Harabacka",
              en: "Road 7 Porvoo, Harabacka",
            },
          },
          roadAddress: { $ref: "#/components/schemas/StationRoadAddressV1" },
          liviId: { type: "string", description: "Id in road registry" },
          country: {
            type: "string",
            description: "Country where station is located",
          },
          startTime: {
            type: "string",
            description: "Station established date time",
            format: "date-time",
          },
          repairMaintenanceTime: {
            type: "string",
            description: "Repair maintenance date time",
            format: "date-time",
          },
          annualMaintenanceTime: {
            type: "string",
            description: "Annual maintenance date time",
            format: "date-time",
          },
          purpose: {
            type: "string",
            description: "Purpose of the road station",
          },
          municipality: { type: "string", description: "Municipality" },
          municipalityCode: {
            type: "integer",
            description: "Municipality code",
            format: "int32",
          },
          province: { type: "string", description: "Province" },
          provinceCode: {
            type: "integer",
            description: "Province code",
            format: "int32",
          },
          presets: {
            type: "array",
            description: "Weathercam presets",
            items: { $ref: "#/components/schemas/WeathercamPresetDetailedV1" },
          },
        },
        description:
          "Weathercam station properties object with detailed information",
      },
      PresetHistory: {
        required: ["id", "presets"],
        type: "object",
        properties: {
          id: { type: "string", description: "Id of the road station" },
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          presets: {
            type: "array",
            description: "Weathercam presets histories",
            items: {
              $ref: "#/components/schemas/WeathercamPresetHistoryDtoV1",
            },
          },
        },
        description: "Weather camera preset's image history.",
      },
      WeathercamPresetHistoryDtoV1: {
        required: ["history", "id"],
        type: "object",
        properties: {
          id: { type: "string", description: "Weathercam preset's id" },
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          history: {
            type: "array",
            description: "Weathercam preset's history",
            items: {
              $ref: "#/components/schemas/WeathercamPresetHistoryItemDtoV1",
            },
          },
        },
        description: "Weather camera preset's image history.",
      },
      WeathercamPresetHistoryItemDtoV1: {
        type: "object",
        properties: {
          lastModified: {
            type: "string",
            description: "Last modified date of the image.",
            format: "date-time",
          },
          imageUrl: { type: "string", description: "Url to read the image." },
          sizeBytes: {
            type: "integer",
            description: "Image size in bytes.",
            format: "int32",
          },
        },
        description: "Weather camera preset's image history details.",
      },
      WeathercamPresetDataV1: {
        required: ["id", "measuredTime"],
        type: "object",
        properties: {
          id: { type: "string", description: "Id of the weathercam preset" },
          measuredTime: {
            type: "string",
            description: "Latest measurement time",
            format: "date-time",
          },
        },
        description: "Weathercam preset's latest image capture data",
      },
      WeathercamStationDataV1: {
        required: ["id", "presets"],
        type: "object",
        properties: {
          id: { type: "string", description: "Id of the road station" },
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          presets: {
            type: "array",
            description: "Weathercam presets data",
            items: { $ref: "#/components/schemas/WeathercamPresetDataV1" },
          },
        },
        description: "Weathercam stations' data",
      },
      CameraHistory: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          stations: {
            type: "array",
            description: "Stations data",
            items: { $ref: "#/components/schemas/PresetHistory" },
          },
        },
        description: "Weather camera's image history details.",
      },
      WeathercamStationsDataV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          stations: {
            type: "array",
            description: "Stations data",
            items: { $ref: "#/components/schemas/WeathercamStationDataV1" },
          },
        },
        description: "Weathercam stations' data",
      },
      WeathercamPresetPublicityHistoryV1: {
        required: ["id"],
        type: "object",
        properties: {
          id: { type: "string", description: "Id of the weathercam preset" },
          measuredTime: {
            type: "string",
            description:
              "The time when change took place. Same as the last modified date of the related image version.",
            format: "date-time",
          },
          publishableTo: {
            type: "boolean",
            description: "New state for publicity",
          },
          modifiedTime: {
            type: "string",
            description: "Modification time of the history.",
            format: "date-time",
          },
        },
        description: "Weathercam station preset's publicity changes",
      },
      WeathercamStationPresetsPublicityHistoryV1: {
        required: ["id", "presets"],
        type: "object",
        properties: {
          id: { type: "string", description: "Id of the road station" },
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          presets: {
            type: "array",
            description: "Id of the weathercam station",
            items: {
              $ref: "#/components/schemas/WeathercamPresetPublicityHistoryV1",
            },
          },
        },
        description: "Weathercam station presets publicity changes",
      },
      WeathercamStationsPresetsPublicityHistoryV1: {
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description:
              "Latest history change time. Use this value as parameter for next query in api.",
            format: "date-time",
          },
          stations: {
            type: "array",
            description: "Stations data",
            items: {
              $ref:
                "#/components/schemas/WeathercamStationPresetsPublicityHistoryV1",
            },
          },
        },
        description: "Weathercam stations presets publicity changes",
      },
      RoadStationState: {
        type: "string",
        description: "Road station state",
        default: "ACTIVE",
        enum: ["ALL", "REMOVED", "ACTIVE"],
      },
      WeatherStationFeatureCollectionSimpleV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: {
              $ref: "#/components/schemas/WeatherStationFeatureSimpleV1",
            },
          },
        },
        description: "GeoJSON Feature Collection of weather stations",
      },
      WeatherStationFeatureSimpleV1: {
        required: ["geometry", "id", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          geometry: { $ref: "#/components/schemas/Point" },
          properties: {
            $ref: "#/components/schemas/WeatherStationPropertiesSimpleV1",
          },
        },
        description:
          "Weather station GeoJSON Feature object with basic information",
      },
      WeatherStationPropertiesSimpleV1: {
        required: ["id"],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          name: { type: "string", description: "Common name of road station" },
          collectionStatus: {
            type: "string",
            description: "Data collection status",
            enum: ["GATHERING", "REMOVED_TEMPORARILY", "REMOVED_PERMANENTLY"],
          },
          state: {
            type: "string",
            description: "Road station state",
            enum: [
              "OK",
              "OK_FAULT_DOUBT_CANCELLED",
              "FAULT_DOUBT",
              "FAULT_CONFIRMED",
              "FAULT_CONFIRMED_NOT_FIXED_IN_NEAR_FUTURE",
              "REPAIR_REQUEST_POSTED",
              "REPAIR_MAINTENANCE_DONE",
              "REPAIR_INTERRUPTED",
            ],
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
        },
        description: "Weather station properties object with basic information",
      },
      WeatherStationFeatureDetailedV1: {
        required: ["geometry", "id", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          geometry: { $ref: "#/components/schemas/Point" },
          properties: {
            $ref: "#/components/schemas/WeatherStationPropertiesDetailedV1",
          },
        },
        description:
          "Weather station GeoJSON feature object with detailed information",
      },
      WeatherStationPropertiesDetailedV1: {
        required: ["id", "master"],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          name: { type: "string", description: "Common name of road station" },
          collectionStatus: {
            type: "string",
            description: "Data collection status",
            enum: ["GATHERING", "REMOVED_TEMPORARILY", "REMOVED_PERMANENTLY"],
          },
          state: {
            type: "string",
            description: "Road station state",
            enum: [
              "OK",
              "OK_FAULT_DOUBT_CANCELLED",
              "FAULT_DOUBT",
              "FAULT_CONFIRMED",
              "FAULT_CONFIRMED_NOT_FIXED_IN_NEAR_FUTURE",
              "REPAIR_REQUEST_POSTED",
              "REPAIR_MAINTENANCE_DONE",
              "REPAIR_INTERRUPTED",
            ],
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          collectionInterval: {
            type: "integer",
            description: "Data collection interval [s]",
            format: "int32",
          },
          names: {
            type: "object",
            additionalProperties: {
              type: "string",
              description: "Map of names [fi, sv, en]",
              example:
                '{"fi":"Tie 7 Porvoo, Harabacka","sv":"Väg 7 Borgå, Harabacka","en":"Road 7 Porvoo, Harabacka"}',
            },
            description: "Map of names [fi, sv, en]",
            example: {
              fi: "Tie 7 Porvoo, Harabacka",
              sv: "Väg 7 Borgå, Harabacka",
              en: "Road 7 Porvoo, Harabacka",
            },
          },
          roadAddress: { $ref: "#/components/schemas/StationRoadAddressV1" },
          liviId: { type: "string", description: "Id in road registry" },
          country: {
            type: "string",
            description: "Country where station is located",
          },
          startTime: {
            type: "string",
            description: "Station established date time",
            format: "date-time",
          },
          repairMaintenanceTime: {
            type: "string",
            description: "Repair maintenance date time",
            format: "date-time",
          },
          annualMaintenanceTime: {
            type: "string",
            description: "Annual maintenance date time",
            format: "date-time",
          },
          purpose: {
            type: "string",
            description: "Purpose of the road station",
          },
          municipality: { type: "string", description: "Municipality" },
          municipalityCode: {
            type: "integer",
            description: "Municipality code",
            format: "int32",
          },
          province: { type: "string", description: "Province" },
          provinceCode: {
            type: "integer",
            description: "Province code",
            format: "int32",
          },
          stationType: {
            type: "string",
            description: "Type of weather station",
            enum: [
              "ROSA",
              "RWS_200",
              "E_18",
              "FINAVIA_V",
              "FINAVIA_B",
              "ELY_B",
              "ISGN",
              "VAISALA_API",
              "OLD",
              "FINAVIA",
            ],
          },
          master: {
            type: "boolean",
            description: "Is station master or slave station",
          },
          sensors: {
            type: "array",
            description: "Weather station sensors ids",
            items: {
              type: "integer",
              description: "Weather station sensors ids",
              format: "int64",
            },
          },
        },
        description: "Weather station properties object with basic information",
      },
      SensorValueDtoV1: {
        required: [
          "id",
          "measuredTime",
          "name",
          "shortName",
          "stationId",
          "unit",
          "value",
        ],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Sensor type id (naturalId)",
            format: "int64",
          },
          stationId: { type: "integer", format: "int64" },
          name: { type: "string", description: "Sensor name" },
          shortName: { type: "string", description: "Sensor short name" },
          timeWindowStart: {
            type: "string",
            description:
              "Measurement time window start time (only for fixed time window sensors)",
            format: "date-time",
          },
          timeWindowEnd: {
            type: "string",
            description:
              "Measurement time window end time (only for fixed time window sensors)",
            format: "date-time",
          },
          measuredTime: {
            type: "string",
            description: "Measurement time",
            format: "date-time",
          },
          value: {
            type: "number",
            description: "Measured sensor value",
            format: "double",
          },
          sensorValueDescriptionFi: {
            type: "string",
            description: "Additional information of sensor value [fi]",
          },
          sensorValueDescriptionEn: {
            type: "string",
            description: "Additional information of sensor value [en]",
          },
          unit: { type: "string", description: "Measured sensor value unit" },
        },
        description: "Sensor value",
      },
      WeatherStationDataDtoV1: {
        required: ["id", "sensorValues"],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          sensorValues: {
            type: "array",
            description: "Measured sensor values of the station",
            items: { $ref: "#/components/schemas/SensorValueDtoV1" },
          },
        },
        description: "Weather station data with sensor values",
      },
      WeatherStationsDataDtoV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          stations: {
            type: "array",
            description: "Stations data",
            items: { $ref: "#/components/schemas/WeatherStationDataDtoV1" },
          },
        },
        description: "Latest measurement data from Weather stations",
      },
      RoadStationSensorDirection: {
        type: "string",
        description:
          "Road station sensor direction<br>UNKNOWN: 0 = Unknown direction.<br>INCREASING_DIRECTION: 1 = According to the road register address increasing direction. I.e. on the road 4 to Rovaniemi.<br>DECREASING_DIRECTION: 2 = According to the road register address decreasing direction. I.e. on the road 4 to Helsinki.",
        enum: ["UNKNOWN", "INCREASING_DIRECTION", "DECREASING_DIRECTION"],
      },
      SensorValueDescription: {
        type: "object",
        properties: {
          descriptionEn: {
            type: "string",
            description: "Sensor description [en]",
          },
          descriptionFi: {
            type: "string",
            description: "Sensor description [fi]",
          },
          sensorValue: {
            type: "number",
            description: "Sensor value",
            format: "double",
          },
        },
        description: "Additional information of sensor values",
      },
      WeatherStationSensorDtoV1: {
        required: ["id"],
        type: "object",
        properties: {
          id: { type: "integer", description: "Sensor id", format: "int64" },
          name: { type: "string", description: "Sensor name [fi]" },
          shortName: {
            type: "string",
            description: "Short name for sensor [fi]",
          },
          unit: { type: "string", description: "Unit of sensor value" },
          accuracy: {
            type: "integer",
            description: "Sensor accuracy",
            format: "int32",
          },
          sensorValueDescriptions: {
            type: "array",
            description: "Descriptions for sensor values",
            items: { $ref: "#/components/schemas/SensorValueDescription" },
          },
          presentationNames: {
            type: "object",
            additionalProperties: {
              type: "string",
              description: "Map of presentation names [fi, sv, en]",
            },
            description: "Map of presentation names [fi, sv, en]",
          },
          descriptions: {
            type: "object",
            additionalProperties: {
              type: "string",
              description: "Map of sensor descriptions [fi, sv, en]",
            },
            description: "Map of sensor descriptions [fi, sv, en]",
          },
          direction: {
            $ref: "#/components/schemas/RoadStationSensorDirection",
          },
          description: {
            type: "string",
            description: "Sensor description [fi]",
          },
        },
        description: "Weather road station sensor",
      },
      WeatherStationSensorsDtoV1: {
        required: ["dataLastCheckedTime", "dataUpdatedTime", "sensors"],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          dataLastCheckedTime: {
            type: "string",
            description: "Data last checked date time",
            format: "date-time",
          },
          sensors: {
            type: "array",
            description: "Available sensors of road stations",
            items: { $ref: "#/components/schemas/WeatherStationSensorDtoV1" },
          },
        },
        description: "Available sensors of weather stations",
      },
      ForecastSectionFeatureCollectionV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: { $ref: "#/components/schemas/ForecastSectionFeatureV1" },
          },
        },
        description: "GeoJSON feature collection of forecast sections",
      },
      ForecastSectionFeatureV1: {
        required: ["geometry", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          id: {
            type: "string",
            description:
              "Forecast section identifier ie. 00004_342_01435_0_274.569: \n1. Road number 5 characters ie. 00004, \n2. Road section 3 characters ie. 342, \n3. Start distance 5 characters ie. 000, \n4. Carriageway 1 character, \n5. Measure value of link start point. Varying number of characters ie. 274.569, \nRefers to Digiroad content at https://aineistot.vayla.fi/digiroad/",
          },
          geometry: {
            oneOf: [
              { $ref: "#/components/schemas/LineString" },
              { $ref: "#/components/schemas/MultiLineString" },
              { $ref: "#/components/schemas/MultiPoint" },
              { $ref: "#/components/schemas/MultiPolygon" },
              { $ref: "#/components/schemas/Point" },
              { $ref: "#/components/schemas/Polygon" },
            ],
          },
          properties: {
            $ref: "#/components/schemas/ForecastSectionPropertiesV1",
          },
        },
        description: "GeoJSON feature object of forecast section",
      },
      ForecastSectionPropertiesV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "Forecast section identifier ie. 00004_342_01435_0_274.569: \n1. Road number 5 characters ie. 00004, \n2. Road section 3 characters ie. 342, \n3. Start distance 5 characters ie. 000, \n4. Carriageway 1 character, \n5. Measure value of link start point. Varying number of characters ie. 274.569, \nRefers to Digiroad content at https://aineistot.vayla.fi/digiroad/",
          },
          description: {
            type: "string",
            description: "Forecast section description",
          },
          roadSectionNumber: {
            type: "integer",
            description: "Road section number",
            format: "int32",
          },
          roadNumber: {
            type: "integer",
            description: "Forecast section road number",
            format: "int32",
          },
          length: {
            type: "integer",
            description: "Forecast section length in meters",
            format: "int32",
          },
          roadSegments: {
            type: "array",
            description:
              "Forecast section road segments. Refers to https://aineistot.vayla.fi/digiroad/",
            items: { $ref: "#/components/schemas/RoadSegmentDtoV1" },
          },
          linkIds: {
            type: "array",
            description:
              "Forecast section link indices. Refers to https://aineistot.vayla.fi/digiroad/",
            items: {
              type: "integer",
              description:
                "Forecast section link indices. Refers to https://aineistot.vayla.fi/digiroad/",
              format: "int64",
            },
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
        },
        description: "Forecast Section Properties",
      },
      GeometryObject: {
        required: ["coordinates", "type"],
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "GeoJson Geometry Object type",
            enum: [
              "Point",
              "LineString",
              "Polygon",
              "MultiPoint",
              "MultiLineString",
              "MultiPolygon",
            ],
          },
          coordinates: {
            type: "array",
            description: "GeoJson Geometry Object coordinates",
            items: {
              type: "object",
              description: "GeoJson Geometry Object coordinates",
            },
          },
        },
        description: "GeoJson Geometry Object",
        discriminator: { propertyName: "type" },
      },
      LineString: {
        required: ["coordinates", "type"],
        type: "object",
        description: "GeoJson LineString Geometry Object",
        allOf: [
          { $ref: "#/components/schemas/GeometryObject" },
          {
            type: "object",
            properties: {
              type: {
                type: "string",
                example: "LineString",
                enum: ["LineString"],
              },
              coordinates: {
                type: "array",
                description:
                  "An array of Point coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                example: [
                  [26.97677492, 65.3467385],
                  [26.98433065, 65.35836767],
                ],
                items: {
                  type: "array",
                  description:
                    "An array of Point coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                  example: [
                    [26.97677492, 65.3467385],
                    [26.98433065, 65.35836767],
                  ],
                  items: {
                    type: "number",
                    description:
                      "An array of Point coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                    format: "double",
                  },
                },
              },
            },
          },
        ],
      },
      MultiLineString: {
        required: ["coordinates", "type"],
        type: "object",
        description: "GeoJson MultiLineString Geometry Object",
        allOf: [
          { $ref: "#/components/schemas/GeometryObject" },
          {
            type: "object",
            properties: {
              type: {
                type: "string",
                example: "MultiLineString",
                enum: ["MultiLineString"],
              },
              coordinates: {
                type: "array",
                description:
                  "An array of LineString coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                example: [
                  [
                    [100, 0],
                    [101, 1],
                  ],
                  [
                    [102, 2],
                    [103, 3],
                  ],
                ],
                items: {
                  type: "array",
                  description:
                    "An array of LineString coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                  example: [
                    [
                      [100, 0],
                      [101, 1],
                    ],
                    [
                      [102, 2],
                      [103, 3],
                    ],
                  ],
                  items: {
                    type: "array",
                    description:
                      "An array of LineString coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                    example: [
                      [
                        [100, 0],
                        [101, 1],
                      ],
                      [
                        [102, 2],
                        [103, 3],
                      ],
                    ],
                    items: {
                      type: "number",
                      description:
                        "An array of LineString coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                      format: "double",
                    },
                  },
                },
              },
            },
          },
        ],
      },
      MultiPoint: {
        required: ["coordinates", "type"],
        type: "object",
        description: "GeoJson MultiPoint Geometry Object",
        allOf: [
          { $ref: "#/components/schemas/GeometryObject" },
          {
            type: "object",
            properties: {
              type: {
                type: "string",
                example: "MultiPoint",
                enum: ["MultiPoint"],
              },
              coordinates: {
                type: "array",
                description:
                  "An array of Point coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                example: [
                  [26.97677492, 65.3467385],
                  [26.98433065, 65.35836767],
                ],
                items: {
                  type: "array",
                  description:
                    "An array of Point coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                  example: [
                    [26.97677492, 65.3467385],
                    [26.98433065, 65.35836767],
                  ],
                  items: {
                    type: "number",
                    description:
                      "An array of Point coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                    format: "double",
                  },
                },
              },
            },
          },
        ],
      },
      MultiPolygon: {
        required: ["coordinates", "type"],
        type: "object",
        description: "GeoJson MultiPolygon Geometry Object",
        allOf: [
          { $ref: "#/components/schemas/GeometryObject" },
          {
            type: "object",
            properties: {
              type: {
                type: "string",
                example: "MultiPolygon",
                enum: ["MultiPolygon"],
              },
              coordinates: {
                type: "array",
                description:
                  "An array of Polygon coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                example: [
                  [
                    [
                      [30, 20],
                      [45, 40],
                      [10, 40],
                      [30, 20],
                    ],
                  ],
                  [
                    [
                      [15, 5],
                      [40, 10],
                      [10, 20],
                      [5, 10],
                      [15, 5],
                    ],
                  ],
                ],
                items: {
                  type: "array",
                  description:
                    "An array of Polygon coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                  example: [
                    [
                      [
                        [30, 20],
                        [45, 40],
                        [10, 40],
                        [30, 20],
                      ],
                    ],
                    [
                      [
                        [15, 5],
                        [40, 10],
                        [10, 20],
                        [5, 10],
                        [15, 5],
                      ],
                    ],
                  ],
                  items: {
                    type: "array",
                    description:
                      "An array of Polygon coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                    example: [
                      [
                        [
                          [30, 20],
                          [45, 40],
                          [10, 40],
                          [30, 20],
                        ],
                      ],
                      [
                        [
                          [15, 5],
                          [40, 10],
                          [10, 20],
                          [5, 10],
                          [15, 5],
                        ],
                      ],
                    ],
                    items: {
                      type: "array",
                      description:
                        "An array of Polygon coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                      example: [
                        [
                          [
                            [30, 20],
                            [45, 40],
                            [10, 40],
                            [30, 20],
                          ],
                        ],
                        [
                          [
                            [15, 5],
                            [40, 10],
                            [10, 20],
                            [5, 10],
                            [15, 5],
                          ],
                        ],
                      ],
                      items: {
                        type: "number",
                        description:
                          "An array of Polygon coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                        format: "double",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      Polygon: {
        required: ["coordinates", "type"],
        type: "object",
        description: "GeoJson Polygon Geometry Object",
        allOf: [
          { $ref: "#/components/schemas/GeometryObject" },
          {
            type: "object",
            properties: {
              type: { type: "string", example: "Polygon", enum: ["Polygon"] },
              coordinates: {
                type: "array",
                description:
                  "An array of LinearRing coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                example: [
                  [
                    [100, 0],
                    [101, 1],
                  ],
                  [
                    [102, 2],
                    [103, 3],
                  ],
                ],
                items: {
                  type: "array",
                  description:
                    "An array of LinearRing coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                  example: [
                    [
                      [100, 0],
                      [101, 1],
                    ],
                    [
                      [102, 2],
                      [103, 3],
                    ],
                  ],
                  items: {
                    type: "array",
                    description:
                      "An array of LinearRing coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                    example: [
                      [
                        [100, 0],
                        [101, 1],
                      ],
                      [
                        [102, 2],
                        [103, 3],
                      ],
                    ],
                    items: {
                      type: "number",
                      description:
                        "An array of LinearRing coordinates. Coordinates are in WGS84 format in decimal degrees: [LONGITUDE, LATITUDE, {ALTITUDE}]. Altitude is optional and measured in meters.",
                      format: "double",
                    },
                  },
                },
              },
            },
          },
        ],
      },
      RoadSegmentDtoV1: {
        type: "object",
        properties: {
          startDistance: {
            type: "integer",
            description: "Road segment start distance",
            format: "int32",
          },
          endDistance: {
            type: "integer",
            description: "Road segment end distance",
            format: "int32",
          },
          carriageway: {
            type: "integer",
            description: "Road segment carriageway",
            format: "int32",
          },
        },
        description:
          "Forecast section road segments. Refers to https://aineistot.vayla.fi/digiroad/",
      },
      ForecastConditionReasonDtoV1: {
        type: "object",
        properties: {
          precipitationCondition: {
            type: "string",
            description:
              "Precipitation condition:<br>\n0 = no data available,<br>\n1 = rain intensity lt 0.2 mm/h,<br>\n2 = rain intensity ge 0.2 mm/h,<br>\n3 = rain intensity ge 2.5 mm/h,<br>\n4 = rain intensity ge 7.6 mm/h,<br>\n5 = snowing intensity ge 0.2 cm/h,<br>\n6 = snowing intensity ge 1 cm/h,<br>\n7 = snowing intensity ge 3 cm/h<br>\n(lt = lower than, ge = greater or equal)",
            enum: [
              "NO_DATA_AVAILABLE",
              "NO_RAIN_DRY_WEATHER",
              "LIGHT_RAIN",
              "RAIN",
              "HEAVY_RAIN",
              "LIGHT_SNOWFALL",
              "SNOWFALL",
              "HEAVY_SNOWFALL",
            ],
          },
          roadCondition: {
            type: "string",
            description: "The state of the road",
            enum: [
              "DRY",
              "MOIST",
              "WET",
              "SLUSH",
              "FROST",
              "PARTLY_ICY",
              "ICE",
              "SNOW",
            ],
          },
          windCondition: {
            type: "string",
            description: "The strength of wind",
            enum: ["WEAK", "MEDIUM", "STRONG"],
          },
          freezingRainCondition: {
            type: "boolean",
            description: "Tells if there is freezing rain: true/false",
          },
          winterSlipperiness: {
            type: "boolean",
            description: "Tells if it is slippery: true/false",
          },
          visibilityCondition: {
            type: "string",
            description: "Visibility",
            enum: ["FAIRLY_POOR", "POOR"],
          },
          frictionCondition: {
            type: "string",
            description: "The amount of friction on the road",
            enum: ["SLIPPERY", "VERY_SLIPPERY"],
          },
        },
        description:
          "Forecast that is used is Vaisala’s weather forecast which is initialised from the weather model that performs best for Finland for a period under study. Majority of the times the initialisation is done from ECMWF model data. Then Vaisala meteorologists also manually edit the data to fix certain known errors in the model.",
      },
      ForecastSectionWeatherDtoV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "VERSION 1: Forecast section identifier 15 characters ie. 00004_112_000_0: <br>\n1. Road number 5 characters ie. 00004, <br>\n2. Road section 3 characters ie. 112, <br>\n3. Road section version 3 characters ie. 000, <br>\n4. Reserved for future needs 1 characters default 0 <br>\n<br>\nVERSION 2: Forecast section identifier ie. 00004_342_01435_0_274.569: <br>\n1. Road number 5 characters ie. 00004, <br>\n2. Road section 3 characters ie. 342, <br>\n3. Start distance 5 characters ie. 000, <br>\n4. Carriageway 1 character, <br>\n5. Measure value of link start point. Varying number of characters ie. 274.569, <br>\nRefers to Digiroad content at https://aineistot.vayla.fi/digiroad/",
          },
          forecasts: {
            type: "array",
            description: "Forecast section's weather forecasts",
            items: {
              $ref: "#/components/schemas/ForecastSectionWeatherForecastDtoV1",
            },
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
        },
        description: "Forecast section weather forecasts",
      },
      ForecastSectionWeatherForecastDtoV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          time: {
            type: "string",
            description: "Observation or forecast time depending on type",
            format: "date-time",
          },
          type: {
            type: "string",
            description:
              "Tells if object is an observation or a forecast. (OBSERVATION, FORECAST)",
            enum: ["OBSERVATION", "FORECAST"],
          },
          forecastName: { type: "string", description: "Name of the forecast" },
          daylight: {
            type: "boolean",
            description: "Tells if there is daylight: true/false",
          },
          roadTemperature: {
            type: "number",
            description:
              "Road temperature at given time. If not available value is not set",
            format: "double",
          },
          temperature: {
            type: "number",
            description: "Air temperature",
            format: "double",
          },
          windSpeed: {
            type: "number",
            description: "Wind speed in m/s",
            format: "double",
          },
          windDirection: {
            type: "integer",
            description:
              "Wind direction in degrees. 0 when there is no wind or the direction is variable. 90 degrees is arrow to the east (count clockwise)",
            format: "int32",
          },
          overallRoadCondition: {
            type: "string",
            description: "Overall road condition",
            enum: [
              "NORMAL_CONDITION",
              "POOR_CONDITION",
              "EXTREMELY_POOR_CONDITION",
              "CONDITION_COULD_NOT_BE_RESOLVED",
            ],
          },
          weatherSymbol: {
            type: "string",
            description:
              "Weather symbol code. See corresponding symbols at https://www.vaisala.com/en/vaisala-weather-symbols. Symbols are allowed to be used in user's applications but any further modification and redistribution is denied.",
          },
          reliability: {
            type: "string",
            description: "Forecast reliability",
            enum: ["SUCCESSFUL", "NO_DATA_FROM_ROADSTATION", "FAILED"],
          },
          forecastConditionReason: {
            $ref: "#/components/schemas/ForecastConditionReasonDtoV1",
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
        },
        description: "Forecast section's weather forecast",
      },
      ForecastSectionsWeatherDtoV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
          forecastSections: {
            type: "array",
            description: "Forecast sections",
            items: { $ref: "#/components/schemas/ForecastSectionWeatherDtoV1" },
          },
        },
      },
      ForecastSectionFeatureCollectionSimpleV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: {
              $ref: "#/components/schemas/ForecastSectionFeatureSimpleV1",
            },
          },
        },
        description: "GeoJSON feature collection of simple forecast sections",
      },
      ForecastSectionFeatureSimpleV1: {
        required: ["geometry", "id", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          id: {
            type: "string",
            description:
              "Forecast section identifier 15 characters ie. 00004_112_000_0, see properties id description.",
          },
          geometry: { $ref: "#/components/schemas/LineString" },
          properties: {
            $ref: "#/components/schemas/ForecastSectionPropertiesSimpleV1",
          },
        },
        description: "GeoJSON feature object of simple forecast section",
      },
      ForecastSectionPropertiesSimpleV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "Forecast section identifier 15 characters ie. 00004_112_000_0: \n1. Road number 5 characters ie. 00004, \n2. Road section 3 characters ie. 112, \n3. Road section version 3 characters ie. 000, \n4. Reserved for future needs 1 characters default 0",
          },
          description: {
            type: "string",
            description: "Forecast section description",
          },
          roadSectionNumber: {
            type: "integer",
            description: "Road section number",
            format: "int32",
          },
          roadNumber: {
            type: "integer",
            description: "Forecast section road number",
            format: "int32",
          },
          roadSectionVersionNumber: {
            type: "integer",
            description: "Road section version number",
            format: "int32",
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
        },
        description: "Simple forecast section properties",
      },
      SignTextRowV1: {
        type: "object",
        properties: {
          screen: {
            type: "integer",
            description: "Screen number",
            format: "int32",
          },
          rowNumber: {
            type: "integer",
            description: "Row number",
            format: "int32",
          },
          text: { type: "string", description: "Text on a row" },
        },
        description: "Variable Sign text row",
      },
      VariableSignFeatureCollectionV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: { $ref: "#/components/schemas/VariableSignFeatureV1" },
          },
        },
        description: "GeoJSON Feature Collection of variable signs",
      },
      VariableSignFeatureV1: {
        required: ["geometry", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          geometry: { $ref: "#/components/schemas/Point" },
          properties: { $ref: "#/components/schemas/VariableSignPropertiesV1" },
        },
        description: "GeoJSON Feature Object of variable sign",
      },
      VariableSignPropertiesV1: {
        type: "object",
        properties: {
          id: { type: "string", description: "Id" },
          type: {
            type: "string",
            description: "Type",
            enum: ["SPEEDLIMIT", "WARNING", "INFORMATION"],
          },
          roadAddress: {
            type: "string",
            description: "Sign location as road address",
          },
          direction: {
            type: "string",
            description:
              "Direction of variable sign, increasing or decreasing road address",
            nullable: true,
            enum: ["INCREASING", "DECREASING"],
          },
          carriageway: {
            type: "string",
            description:
              "Variable sign placement:\nSINGLE = Single carriageway rod\nRIGHT = First carriageway on the right in the direction of the road number\nLEFT = Second carriageway on the left in the direction of the road number\nBETWEEN = Between the carriageways",
            enum: [
              "SINGLE",
              "RIGHT",
              "LEFT",
              "BETWEEN",
              "END_OF_ROAD",
              "ALONG",
              "ACROSS",
            ],
          },
          displayValue: {
            type: "string",
            description: "Value that is displayed on the device",
          },
          additionalInformation: {
            type: "string",
            description: "Additional information displayed on the device",
            nullable: true,
          },
          effectDate: {
            type: "string",
            description: "Information is effect after this date",
            format: "date-time",
          },
          cause: {
            type: "string",
            description:
              "Cause for changing the sign:\nAutomaatti = Automatic\nKäsiohjaus = By hand",
            nullable: true,
          },
          reliability: {
            type: "string",
            description: "Variable sign reliability",
            enum: ["NORMAL", "DISCONNECTED", "MALFUNCTION"],
          },
          textRows: {
            type: "array",
            description: "Text rows if sign contains a screen",
            items: { $ref: "#/components/schemas/SignTextRowV1" },
          },
        },
        description: "Variable Sign properties",
      },
      HistoryTextRowV1: {
        type: "object",
        properties: {
          text: { type: "string" },
          screen: { type: "integer", format: "int32" },
          rowNumber: { type: "integer", format: "int32" },
        },
      },
      TrafficSignHistoryV1: {
        type: "object",
        properties: {
          cause: { type: "string" },
          displayValue: { type: "string" },
          additionalInformation: { type: "string" },
          effectDate: { type: "string", format: "date-time" },
          rows: {
            type: "array",
            items: { $ref: "#/components/schemas/HistoryTextRowV1" },
          },
        },
      },
      CodeDescription: {
        required: ["code", "description", "descriptionEn"],
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Description of the code (Finnish)",
          },
          descriptionEn: {
            type: "string",
            description: "Description of the code(English",
          },
          code: { type: "string", description: "Code" },
        },
        description: "Description of code",
      },
      VariableSignDescriptions: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          signTypes: {
            type: "array",
            items: { $ref: "#/components/schemas/CodeDescription" },
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
        },
      },
      SituationTypeV1: {
        type: "string",
        description: "Traffic Announcement situation type",
        default: "TRAFFIC_ANNOUNCEMENT",
        enum: [
          "TRAFFIC_ANNOUNCEMENT",
          "EXEMPTED_TRANSPORT",
          "WEIGHT_RESTRICTION",
          "ROAD_WORK",
        ],
      },
      AlertCLocationV1: {
        required: ["locationCode", "name"],
        type: "object",
        properties: {
          locationCode: {
            type: "integer",
            description:
              "AlertC location code. Number of the location point in AlertC location table",
            format: "int32",
          },
          name: { type: "string", description: "Location point name" },
          distance: {
            type: "integer",
            description:
              "Distance of the road point from the AlertC location point",
            format: "int32",
          },
        },
        description: "AlertC location",
      },
      AreaLocationV1: {
        required: ["areas"],
        type: "object",
        properties: {
          areas: {
            type: "array",
            description: "List of areas",
            items: { $ref: "#/components/schemas/AreaV1" },
          },
        },
        description: "Location consisting of one or more areas",
      },
      AreaTypeV1: {
        type: "string",
        description: "Area location type",
        example: "MUNICIPALITY",
        enum: [
          "MUNICIPALITY",
          "PROVINCE",
          "REGIONAL_STATE_ADMINISTRATIVE_AGENCY",
          "WEATHER_REGION",
          "COUNTRY",
          "CITY_REGION",
          "TRAVEL_REGION",
          "UNKNOWN",
        ],
      },
      AreaV1: {
        required: ["locationCode", "name", "type"],
        type: "object",
        properties: {
          name: { type: "string", description: "The name of the area" },
          locationCode: {
            type: "integer",
            description:
              "Location code of the area, number of the road point in AlertC location table",
            format: "int32",
          },
          type: { $ref: "#/components/schemas/AreaTypeV1" },
        },
        description: "AlertC area",
      },
      ContactV1: {
        type: "object",
        properties: {
          phone: { type: "string", description: "Phone number" },
          email: { type: "string", description: "Email" },
        },
        description: "Sender's contact information",
      },
      EstimatedDurationV1: {
        required: ["informal", "minimum"],
        type: "object",
        properties: {
          minimum: {
            pattern:
              "([-+]?)P(?:([-+]?[0-9]+)Y)?(?:([-+]?[0-9]+)M)?(?:([-+]?[0-9]+)W)?(?:([-+]?[0-9]+)D)?(T(?:([-+]?[0-9]+)H)?(?:([-+]?[0-9]+)M)?(?:([-+]?[0-9]+)(?:[.,]([0-9]{0,9}))?S)?)?",
            type: "string",
            description: "Estimated minimum duration using ISO-8601 duration",
            example: "PT6H",
          },
          maximum: {
            pattern:
              "([-+]?)P(?:([-+]?[0-9]+)Y)?(?:([-+]?[0-9]+)M)?(?:([-+]?[0-9]+)W)?(?:([-+]?[0-9]+)D)?(T(?:([-+]?[0-9]+)H)?(?:([-+]?[0-9]+)M)?(?:([-+]?[0-9]+)(?:[.,]([0-9]{0,9}))?S)?)?",
            type: "string",
            description: "Estimated maximum duration using ISO-8601 duration",
            example: "PT8H",
          },
          informal: {
            type: "string",
            description: "Informal description e.g. 1 - 3 hours",
          },
        },
        description: "Announcement estimated duration",
      },
      FeatureV1: {
        required: ["name"],
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Feature name, e.g.black ice on road, or speed limit",
            example: "speed limit",
          },
          quantity: {
            type: "number",
            description: "Feature quantity, e.g. 30 in {speed limit, 30, km/h}",
            format: "double",
            example: 30,
          },
          unit: {
            type: "string",
            description:
              "Unit of the feature quantity, e.g. km/h in {speed limit, 30, km/h}",
            example: "km/h",
          },
          description: {
            type: "string",
            description:
              "Further details of the feature, e.g. description of a detour",
            example: "The road is narrow and winding",
          },
          timeAndDuration: { $ref: "#/components/schemas/TimeAndDurationV1" },
        },
        description: "Characteristics and qualities of the situation",
      },
      ItineraryLegV1: {
        type: "object",
        properties: {
          roadLeg: { $ref: "#/components/schemas/ItineraryRoadLegV1" },
          streetName: {
            type: "string",
            description: "Name of the street if leg is on the street network",
          },
        },
        description: "ItineraryLeg is one leg of the route",
      },
      ItineraryRoadLegV1: {
        type: "object",
        properties: {
          roadNumber: {
            type: "integer",
            description: "Number of the road.",
            format: "int32",
          },
          roadName: { type: "string", description: "Name of the road." },
          startArea: {
            type: "string",
            description:
              "Description of the place on the road, where this leg starts.",
          },
          endArea: {
            type: "string",
            description:
              "Description of the place on the road, where this leg ends.",
          },
        },
        description:
          "ItineraryRoadLeg is route leg that is on the road network.",
      },
      LastActiveItinerarySegmentV1: {
        required: ["endTime", "legs", "startTime"],
        type: "object",
        properties: {
          startTime: {
            type: "string",
            description: "The time when the transport may start this segment.",
            format: "date-time",
          },
          endTime: {
            type: "string",
            description:
              "Time by which the transport has finished this segment.",
            format: "date-time",
          },
          legs: {
            type: "array",
            description: "Route legs.",
            items: { $ref: "#/components/schemas/ItineraryLegV1" },
          },
        },
        description:
          "The itinerary segment of this special transport that is or was last active.",
      },
      LocalTime: {
        type: "object",
        properties: {
          hour: { type: "integer", format: "int32" },
          minute: { type: "integer", format: "int32" },
          second: { type: "integer", format: "int32" },
          nano: { type: "integer", format: "int32" },
        },
        description:
          "End time of the time period in ISO 8601 local time in Europe/Helsinki",
        example: "15:30:00",
      },
      LocationDetailsV1: {
        type: "object",
        properties: {
          areaLocation: { $ref: "#/components/schemas/AreaLocationV1" },
          roadAddressLocation: {
            $ref: "#/components/schemas/RoadAddressLocationV1",
          },
        },
        description: "LocationDetails",
      },
      LocationV1: {
        required: [
          "countryCode",
          "description",
          "locationTableNumber",
          "locationTableVersion",
        ],
        type: "object",
        properties: {
          countryCode: {
            type: "integer",
            description: "AlertC country code defined by RDS (IEC 62106)",
            format: "int32",
          },
          locationTableNumber: {
            type: "integer",
            description:
              "AlertC location table number. Country code + location table number fully identifies the table.",
            format: "int32",
          },
          locationTableVersion: {
            type: "string",
            description: "AlertC location table version number",
          },
          description: {
            type: "string",
            description: "Textual representation of the location",
          },
        },
        description: "AlertC location of a traffic situation announcement",
      },
      RestrictionV1: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Type of the restriction.",
            enum: [
              "SPEED_LIMIT",
              "SPEED_LIMIT_LENGTH",
              "TRAFFIC_LIGHTS",
              "MULTIPLE_LANES_CLOSED",
              "SINGLE_LANE_CLOSED",
              "SINGLE_CARRIAGEWAY_CLOSED",
              "ROAD_CLOSED",
              "SINGLE_ALTERNATE_LINE_TRAFFIC",
              "CONTRA_FLOW_TRAFFIC",
              "INTERMITTENT_SHORT_TERM_STOPS",
              "INTERMITTENT_SHORT_TERM_CLOSURE",
              "INTERMITTENT_STOPS_AND_CLOSURE_EFFECTIVE",
              "NARROW_LANES",
              "DETOUR",
              "DETOUR_SIGNS",
              "DETOUR_CURVES_STEEP",
              "DETOUR_CURVES_GENTLE",
              "DETOUR_USING_ROADWAYS",
              "DETOUR_SURFACE_PAVED",
              "DETOUR_SURFACE_MILLED",
              "DETOUR_SURFACE_GRAVEL",
              "DETOUR_LENGTH",
              "DETOUR_GROSS_WEIGHT_LIMIT",
              "SLOW_MOVING_MAINTENANCE_VEHICLE",
              "ESTIMATED_DELAY",
              "ESTIMATED_DELAY_DURING_RUSH_HOUR",
              "NARROW_OR_CLOSED_PEDESTRIAN_AND_BICYLE_PATH",
              "VEHICLE_HEIGHT_LIMIT",
              "VEHICLE_WIDTH_LIMIT",
              "VEHICLE_LENGTH_LIMIT",
              "VEHICLE_GROSS_WEIGHT_LIMIT",
              "ROAD_SURFACE_PAVED",
              "ROAD_SURFACE_MILLED",
              "ROAD_SURFACE_GRAVEL",
              "OPEN_FIRE_HEATER_IN_USE",
            ],
          },
          restriction: { $ref: "#/components/schemas/FeatureV1" },
        },
        description: "A single phase in a larger road work",
      },
      RoadAddressLocationV1: {
        required: ["direction", "primaryPoint"],
        type: "object",
        properties: {
          primaryPoint: { $ref: "#/components/schemas/RoadPointV1" },
          secondaryPoint: { $ref: "#/components/schemas/RoadPointV1" },
          direction: {
            type: "string",
            description: "Affected road direction",
            enum: ["UNKNOWN", "POS", "NEG", "BOTH"],
          },
          directionDescription: {
            type: "string",
            description: "Human readable description of the affected direction",
          },
        },
        description:
          "Location consisting of a single road point or a road segment between two road points",
      },
      RoadPointV1: {
        required: ["alertCLocation", "roadAddress"],
        type: "object",
        properties: {
          municipality: {
            type: "string",
            description: "City, town or village.",
          },
          province: { type: "string", description: "Province eq. Satakunta." },
          country: {
            type: "string",
            description:
              "Usually Finland, but may be something else eq. Sweden, Norway, Russia.",
          },
          roadAddress: {
            $ref: "#/components/schemas/TrafficMessageRoadAddressV1",
          },
          roadName: {
            type: "string",
            description: "Name of the road where the accident happened.",
          },
          alertCLocation: { $ref: "#/components/schemas/AlertCLocationV1" },
        },
        description: "A single road point",
      },
      RoadWorkPhaseV1: {
        required: ["id", "severity", "timeAndDuration", "workingHours"],
        type: "object",
        properties: {
          id: { type: "string", description: "id" },
          location: { $ref: "#/components/schemas/LocationV1" },
          locationDetails: { $ref: "#/components/schemas/LocationDetailsV1" },
          workingHours: {
            type: "array",
            description: "WorkingHours of an traffic situation announcement",
            items: { $ref: "#/components/schemas/WeekdayTimePeriodV1" },
          },
          comment: { type: "string", description: "Free comment" },
          timeAndDuration: { $ref: "#/components/schemas/TimeAndDurationV1" },
          workTypes: {
            type: "array",
            description: "The types of work that are carried out",
            items: { $ref: "#/components/schemas/WorkTypeV1" },
          },
          restrictions: {
            type: "array",
            description: "Restrictions on traffic",
            items: { $ref: "#/components/schemas/RestrictionV1" },
          },
          restrictionsLiftable: {
            type: "boolean",
            description: "Restrictions can be lifted for abnormal transports",
          },
          severity: {
            type: "string",
            description:
              "Severity of the disruption to traffic. How severely this road work phase disrupts traffic. LOW - no disruption, HIGH - disruption, HIGHEST - significant disruption",
            enum: ["LOW", "HIGH", "HIGHEST"],
          },
          slowTrafficTimes: {
            type: "array",
            description:
              "Time periods when the road work is expected to cause slow moving traffic.",
            items: { $ref: "#/components/schemas/WeekdayTimePeriodV1" },
          },
          queuingTrafficTimes: {
            type: "array",
            description:
              "Time periods when the road work is expected to cause queuing of the traffic.",
            items: { $ref: "#/components/schemas/WeekdayTimePeriodV1" },
          },
        },
        description: "A single phase in a larger road work",
      },
      TimeAndDurationV1: {
        required: ["startTime"],
        type: "object",
        properties: {
          startTime: {
            type: "string",
            description: "Start time of the situation",
            format: "date-time",
          },
          endTime: {
            type: "string",
            description:
              "End time of the situation. If the end time has been passed, the situation can be assumed to be over. If end time is not given, there will be follow-up announcement about the situation.",
            format: "date-time",
          },
          estimatedDuration: {
            $ref: "#/components/schemas/EstimatedDurationV1",
          },
        },
        description: "Announcement time and duration",
      },
      TrafficAnnouncementFeatureCollectionV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: {
              $ref: "#/components/schemas/TrafficAnnouncementFeatureV1",
            },
          },
        },
        description: "GeoJSON Feature Collection of Traffic Announcements",
      },
      TrafficAnnouncementFeatureV1: {
        required: ["geometry", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          geometry: {
            oneOf: [
              { $ref: "#/components/schemas/LineString" },
              { $ref: "#/components/schemas/MultiLineString" },
              { $ref: "#/components/schemas/MultiPoint" },
              { $ref: "#/components/schemas/MultiPolygon" },
              { $ref: "#/components/schemas/Point" },
              { $ref: "#/components/schemas/Polygon" },
            ],
          },
          properties: {
            $ref: "#/components/schemas/TrafficAnnouncementPropertiesV1",
          },
        },
        description: "TrafficAnnouncement GeoJSON Feature Object",
      },
      TrafficAnnouncementPropertiesV1: {
        required: [
          "announcements",
          "dataUpdatedTime",
          "releaseTime",
          "situationId",
          "situationType",
          "version",
          "versionTime",
        ],
        type: "object",
        properties: {
          situationId: { type: "string", description: "Situation id" },
          situationType: { $ref: "#/components/schemas/SituationTypeV1" },
          trafficAnnouncementType: {
            type: "string",
            description: "Traffic Announcement type",
            enum: [
              "GENERAL",
              "PRELIMINARY_ACCIDENT_REPORT",
              "ACCIDENT_REPORT",
              "UNCONFIRMED_OBSERVATION",
              "ENDED",
              "RETRACTED",
            ],
          },
          version: {
            type: "integer",
            description: "Announcement version",
            format: "int32",
          },
          releaseTime: {
            type: "string",
            description: "Annoucement release time",
            format: "date-time",
          },
          versionTime: {
            type: "string",
            description: "Annoucement version time",
            format: "date-time",
          },
          announcements: {
            type: "array",
            description:
              "Contains announcement's different language versions available.",
            items: { $ref: "#/components/schemas/TrafficAnnouncementV1" },
          },
          contact: { $ref: "#/components/schemas/ContactV1" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
        },
        description: "Traffic Announcement properties",
      },
      TrafficAnnouncementV1: {
        required: ["language", "sender", "title"],
        type: "object",
        properties: {
          language: {
            type: "string",
            description:
              "Language of the announcement, always fi. A subset of ISO 639-1 in upper case.",
            enum: ["FI"],
          },
          title: {
            type: "string",
            description: "Short description about the situation",
          },
          location: { $ref: "#/components/schemas/LocationV1" },
          locationDetails: { $ref: "#/components/schemas/LocationDetailsV1" },
          features: {
            type: "array",
            description: "Features of the announcement",
            items: { $ref: "#/components/schemas/FeatureV1" },
          },
          roadWorkPhases: {
            type: "array",
            description: "Contains the phases of this road maintenance work",
            items: { $ref: "#/components/schemas/RoadWorkPhaseV1" },
          },
          earlyClosing: {
            type: "string",
            description:
              "Road work was closed before the planned time. 'CLOSED' means the road work closed after its start time, possibly skipping some phases. 'CANCELED' means the road work was canceled before its start time. Note: This field is null if the road work closes normally.",
            enum: ["CLOSED", "CANCELED"],
          },
          comment: { type: "string", description: "Free comment" },
          timeAndDuration: { $ref: "#/components/schemas/TimeAndDurationV1" },
          additionalInformation: {
            type: "string",
            description: "Additional information.",
          },
          sender: { type: "string", description: "Name of the sender" },
          lastActiveItinerarySegment: {
            $ref: "#/components/schemas/LastActiveItinerarySegmentV1",
          },
        },
        description: "Announcement time and duration",
      },
      TrafficMessageRoadAddressV1: {
        required: ["distance", "road", "roadSection"],
        type: "object",
        properties: {
          road: {
            type: "integer",
            description: "Number of the road",
            format: "int32",
          },
          roadSection: {
            type: "integer",
            description: "Number of the road section",
            format: "int32",
          },
          distance: {
            type: "integer",
            description: "Distance from the beginning of the road section.",
            format: "int32",
          },
        },
        description:
          "Location in road address (road number + number of the road section + distance from the beginning of the road section",
      },
      WeekdayTimePeriodV1: {
        required: ["endTime", "startTime", "weekday"],
        type: "object",
        properties: {
          weekday: {
            type: "string",
            description: "Weekday",
            enum: [
              "MONDAY",
              "TUESDAY",
              "WEDNESDAY",
              "THURSDAY",
              "FRIDAY",
              "SATURDAY",
              "SUNDAY",
            ],
          },
          startTime: { $ref: "#/components/schemas/LocalTime" },
          endTime: { $ref: "#/components/schemas/LocalTime" },
        },
        description: "Weekday time period",
      },
      WorkTypeV1: {
        required: ["description", "type"],
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Worktype",
            enum: [
              "BRIDGE",
              "JUNCTION",
              "CRASH_BARRIER",
              "BURIED_CABLES",
              "LIGHTING",
              "ROADSIDE_EQUIPMENT",
              "MEASUREMENT_EQUIPMENT",
              "LEVEL_CROSSING",
              "BLASTING_WORK",
              "ROAD_CONSTRUCTION",
              "STRUCTURAL_IMPROVEMENT",
              "UNDERPASS_CONSTRUCTION",
              "PEDESTRIAN_AND_BICYCLE_PATH",
              "STABILIZATION",
              "RESURFACING",
              "ROAD_SURFACE_MARKING",
              "FINISHING_WORK",
              "MEASUREMENT",
              "TREE_AND_VEGETATION_CUTTING",
              "GRASS_CUTTING",
              "MAINTENANCE",
              "CULVERT_REPLACEMENT",
              "OTHER",
            ],
          },
          description: { type: "string", description: "Description" },
        },
        description: "Work type",
      },
      Attr: {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "string" },
          schemaTypeInfo: { $ref: "#/components/schemas/TypeInfo" },
          specified: { type: "boolean" },
          ownerElement: { $ref: "#/components/schemas/Element" },
          id: { type: "boolean" },
          attributes: { $ref: "#/components/schemas/NamedNodeMap" },
          nodeName: { type: "string" },
          nodeValue: { type: "string" },
          parentNode: { $ref: "#/components/schemas/Node" },
          childNodes: { $ref: "#/components/schemas/NodeList" },
          firstChild: { $ref: "#/components/schemas/Node" },
          lastChild: { $ref: "#/components/schemas/Node" },
          previousSibling: { $ref: "#/components/schemas/Node" },
          nextSibling: { $ref: "#/components/schemas/Node" },
          ownerDocument: { $ref: "#/components/schemas/Document" },
          namespaceURI: { type: "string" },
          localName: { type: "string" },
          baseURI: { type: "string" },
          textContent: { type: "string" },
          prefix: { type: "string" },
          nodeType: { type: "integer", format: "int32" },
        },
      },
      CatalogueReference: {
        required: ["keyCatalogueReference"],
        type: "object",
        properties: {
          keyCatalogueReference: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          catalogueReferenceExtension: {
            $ref: "#/components/schemas/ExtensionType",
          },
        },
      },
      D2LogicalModel: {
        required: ["exchange"],
        type: "object",
        properties: {
          exchange: { $ref: "#/components/schemas/Exchange" },
          payloadPublication: {
            $ref: "#/components/schemas/PayloadPublication",
          },
          d2LogicalModelExtension: {
            $ref: "#/components/schemas/ExtensionType",
          },
          modelBaseVersion: { type: "string", xml: { attribute: true } },
        },
        xml: {
          name: "d2LogicalModel",
          namespace: "http://datex2.eu/schema/2/2_0",
        },
      },
      DOMConfiguration: {
        type: "object",
        properties: {
          parameterNames: { $ref: "#/components/schemas/DOMStringList" },
        },
      },
      DOMImplementation: { type: "object" },
      DOMStringList: {
        type: "object",
        properties: { length: { type: "integer", format: "int32" } },
      },
      Document: {
        type: "object",
        properties: {
          doctype: { $ref: "#/components/schemas/DocumentType" },
          documentElement: { $ref: "#/components/schemas/Element" },
          inputEncoding: { type: "string" },
          xmlEncoding: { type: "string" },
          xmlStandalone: { type: "boolean" },
          xmlVersion: { type: "string" },
          strictErrorChecking: { type: "boolean" },
          documentURI: { type: "string" },
          domConfig: { $ref: "#/components/schemas/DOMConfiguration" },
          implementation: { $ref: "#/components/schemas/DOMImplementation" },
          attributes: { $ref: "#/components/schemas/NamedNodeMap" },
          nodeName: { type: "string" },
          nodeValue: { type: "string" },
          parentNode: { $ref: "#/components/schemas/Node" },
          childNodes: { $ref: "#/components/schemas/NodeList" },
          firstChild: { $ref: "#/components/schemas/Node" },
          lastChild: { $ref: "#/components/schemas/Node" },
          previousSibling: { $ref: "#/components/schemas/Node" },
          nextSibling: { $ref: "#/components/schemas/Node" },
          ownerDocument: { $ref: "#/components/schemas/Document" },
          namespaceURI: { type: "string" },
          localName: { type: "string" },
          baseURI: { type: "string" },
          textContent: { type: "string" },
          prefix: { type: "string" },
          nodeType: { type: "integer", format: "int32" },
        },
      },
      DocumentType: {
        type: "object",
        properties: {
          name: { type: "string" },
          publicId: { type: "string" },
          systemId: { type: "string" },
          notations: { $ref: "#/components/schemas/NamedNodeMap" },
          entities: { $ref: "#/components/schemas/NamedNodeMap" },
          internalSubset: { type: "string" },
          attributes: { $ref: "#/components/schemas/NamedNodeMap" },
          nodeName: { type: "string" },
          nodeValue: { type: "string" },
          parentNode: { $ref: "#/components/schemas/Node" },
          childNodes: { $ref: "#/components/schemas/NodeList" },
          firstChild: { $ref: "#/components/schemas/Node" },
          lastChild: { $ref: "#/components/schemas/Node" },
          previousSibling: { $ref: "#/components/schemas/Node" },
          nextSibling: { $ref: "#/components/schemas/Node" },
          ownerDocument: { $ref: "#/components/schemas/Document" },
          namespaceURI: { type: "string" },
          localName: { type: "string" },
          baseURI: { type: "string" },
          textContent: { type: "string" },
          prefix: { type: "string" },
          nodeType: { type: "integer", format: "int32" },
        },
      },
      Element: {
        type: "object",
        properties: {
          schemaTypeInfo: { $ref: "#/components/schemas/TypeInfo" },
          attributeNodeNS: { $ref: "#/components/schemas/Attr" },
          attributeNode: { $ref: "#/components/schemas/Attr" },
          tagName: { type: "string" },
          attributes: { $ref: "#/components/schemas/NamedNodeMap" },
          nodeName: { type: "string" },
          nodeValue: { type: "string" },
          parentNode: { $ref: "#/components/schemas/Node" },
          childNodes: { $ref: "#/components/schemas/NodeList" },
          firstChild: { $ref: "#/components/schemas/Node" },
          lastChild: { $ref: "#/components/schemas/Node" },
          previousSibling: { $ref: "#/components/schemas/Node" },
          nextSibling: { $ref: "#/components/schemas/Node" },
          ownerDocument: { $ref: "#/components/schemas/Document" },
          namespaceURI: { type: "string" },
          localName: { type: "string" },
          baseURI: { type: "string" },
          textContent: { type: "string" },
          prefix: { type: "string" },
          nodeType: { type: "integer", format: "int32" },
        },
      },
      Exchange: {
        required: ["supplierIdentification"],
        type: "object",
        properties: {
          changedFlag: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
            enum: ["CATALOGUE", "FILTER"],
          },
          clientIdentification: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          deliveryBreak: {
            type: "boolean",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          denyReason: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
            enum: [
              "UNKNOWN_REASON",
              "WRONG_CATALOGUE",
              "WRONG_FILTER",
              "WRONG_ORDER",
              "WRONG_PARTNER",
            ],
          },
          historicalStartDate: {
            type: "string",
            format: "date-time",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          historicalStopDate: {
            type: "string",
            format: "date-time",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          keepAlive: {
            type: "boolean",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          requestType: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
            enum: [
              "CATALOGUE",
              "FILTER",
              "REQUEST_DATA",
              "REQUEST_HISTORICAL_DATA",
              "SUBSCRIPTION",
            ],
          },
          response: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
            enum: [
              "ACKNOWLEDGE",
              "CATALOGUE_REQUEST_DENIED",
              "FILTER_REQUEST_DENIED",
              "REQUEST_DENIED",
              "SUBSCRIPTION_REQUEST_DENIED",
            ],
          },
          subscriptionReference: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          supplierIdentification: {
            $ref: "#/components/schemas/InternationalIdentifier",
          },
          target: { $ref: "#/components/schemas/Target" },
          subscription: { $ref: "#/components/schemas/Subscription" },
          filterReferences: {
            type: "array",
            xml: {
              name: "filterReference",
              namespace: "http://datex2.eu/schema/2/2_0",
            },
            items: { $ref: "#/components/schemas/FilterReference" },
          },
          catalogueReferences: {
            type: "array",
            xml: {
              name: "catalogueReference",
              namespace: "http://datex2.eu/schema/2/2_0",
            },
            items: { $ref: "#/components/schemas/CatalogueReference" },
          },
          exchangeExtension: { $ref: "#/components/schemas/ExtensionType" },
        },
      },
      ExtensionType: {
        type: "object",
        properties: {
          anies: {
            type: "array",
            items: { $ref: "#/components/schemas/Element" },
          },
        },
      },
      FilterReference: {
        required: ["keyFilterReference"],
        type: "object",
        properties: {
          deleteFilter: {
            type: "boolean",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          filterOperationApproved: {
            type: "boolean",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          keyFilterReference: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          filterReferenceExtension: {
            $ref: "#/components/schemas/ExtensionType",
          },
        },
      },
      InternationalIdentifier: {
        required: ["country", "nationalIdentifier"],
        type: "object",
        properties: {
          country: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
            enum: [
              "AT",
              "BE",
              "BG",
              "CH",
              "CS",
              "CY",
              "CZ",
              "DE",
              "DK",
              "EE",
              "ES",
              "FI",
              "FO",
              "FR",
              "GB",
              "GG",
              "GI",
              "GR",
              "HR",
              "HU",
              "IE",
              "IM",
              "IS",
              "IT",
              "JE",
              "LI",
              "LT",
              "LU",
              "LV",
              "MA",
              "MC",
              "MK",
              "MT",
              "NL",
              "NO",
              "PL",
              "PT",
              "RO",
              "SE",
              "SI",
              "SK",
              "SM",
              "TR",
              "VA",
              "OTHER",
            ],
          },
          nationalIdentifier: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          internationalIdentifierExtension: {
            $ref: "#/components/schemas/ExtensionType",
          },
        },
      },
      MultilingualString: {
        required: ["values"],
        type: "object",
        properties: { values: { $ref: "#/components/schemas/Values" } },
      },
      MultilingualStringValue: {
        type: "object",
        properties: {
          value: { type: "string" },
          lang: { type: "string", xml: { attribute: true } },
        },
      },
      NamedNodeMap: {
        type: "object",
        properties: {
          length: { type: "integer", format: "int32" },
          namedItem: { $ref: "#/components/schemas/Node" },
          namedItemNS: { $ref: "#/components/schemas/Node" },
        },
      },
      Node: {
        type: "object",
        properties: {
          attributes: { $ref: "#/components/schemas/NamedNodeMap" },
          nodeName: { type: "string" },
          nodeValue: { type: "string" },
          parentNode: { $ref: "#/components/schemas/Node" },
          childNodes: { $ref: "#/components/schemas/NodeList" },
          firstChild: { $ref: "#/components/schemas/Node" },
          lastChild: { $ref: "#/components/schemas/Node" },
          previousSibling: { $ref: "#/components/schemas/Node" },
          nextSibling: { $ref: "#/components/schemas/Node" },
          ownerDocument: { $ref: "#/components/schemas/Document" },
          namespaceURI: { type: "string" },
          localName: { type: "string" },
          baseURI: { type: "string" },
          textContent: { type: "string" },
          prefix: { type: "string" },
          nodeType: { type: "integer", format: "int32" },
        },
      },
      NodeList: {
        type: "object",
        properties: { length: { type: "integer", format: "int32" } },
      },
      PayloadPublication: {
        required: ["publicationCreator", "publicationTime"],
        type: "object",
        properties: {
          feedDescription: { $ref: "#/components/schemas/MultilingualString" },
          feedType: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          publicationTime: {
            type: "string",
            format: "date-time",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          publicationCreator: {
            $ref: "#/components/schemas/InternationalIdentifier",
          },
          payloadPublicationExtension: {
            $ref: "#/components/schemas/ExtensionType",
          },
          lang: { type: "string", xml: { attribute: true } },
        },
      },
      Subscription: {
        required: [
          "operatingMode",
          "subscriptionStartTime",
          "subscriptionState",
          "targets",
          "updateMethod",
        ],
        type: "object",
        properties: {
          deleteSubscription: {
            type: "boolean",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          deliveryInterval: {
            type: "number",
            format: "float",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          operatingMode: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
            enum: [
              "OPERATING_MODE_0",
              "OPERATING_MODE_1",
              "OPERATING_MODE_2",
              "OPERATING_MODE_3",
            ],
          },
          subscriptionStartTime: {
            type: "string",
            format: "date-time",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          subscriptionState: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
            enum: ["ACTIVE", "SUSPENDED"],
          },
          subscriptionStopTime: {
            type: "string",
            format: "date-time",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          updateMethod: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
            enum: ["ALL_ELEMENT_UPDATE", "SINGLE_ELEMENT_UPDATE", "SNAPSHOT"],
          },
          targets: {
            type: "array",
            xml: { name: "target", namespace: "http://datex2.eu/schema/2/2_0" },
            items: { $ref: "#/components/schemas/Target" },
          },
          filterReference: { $ref: "#/components/schemas/FilterReference" },
          catalogueReference: {
            $ref: "#/components/schemas/CatalogueReference",
          },
          subscriptionExtension: { $ref: "#/components/schemas/ExtensionType" },
        },
      },
      Target: {
        required: ["address", "protocol"],
        type: "object",
        properties: {
          address: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          protocol: {
            type: "string",
            xml: { namespace: "http://datex2.eu/schema/2/2_0" },
          },
          targetExtension: { $ref: "#/components/schemas/ExtensionType" },
        },
      },
      TypeInfo: {
        type: "object",
        properties: {
          typeName: { type: "string" },
          typeNamespace: { type: "string" },
        },
      },
      Values: {
        required: ["values"],
        type: "object",
        properties: {
          values: {
            type: "array",
            xml: { name: "value", namespace: "http://datex2.eu/schema/2/2_0" },
            items: { $ref: "#/components/schemas/MultilingualStringValue" },
          },
        },
      },
      LocationFeatureCollectionV1: {
        required: ["dataUpdatedTime", "features", "locationsVersion", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          locationsVersion: {
            type: "string",
            description: "Locations version",
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: { $ref: "#/components/schemas/LocationFeatureV1" },
          },
        },
        description: "Location GeoJSON feature collection object",
      },
      LocationFeatureV1: {
        required: ["geometry", "id", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          id: {
            type: "integer",
            description: "Unique locationCode for this location",
            format: "int32",
          },
          geometry: { $ref: "#/components/schemas/Point" },
          properties: { $ref: "#/components/schemas/LocationPropertiesV1" },
        },
        description: "Location GeoJSON feature object",
      },
      LocationPropertiesV1: {
        required: [
          "dataUpdatedTime",
          "firstName",
          "locationCode",
          "subtypeCode",
        ],
        type: "object",
        properties: {
          locationCode: {
            type: "integer",
            description: "Unique locationCode for this location",
            format: "int32",
          },
          subtypeCode: {
            type: "string",
            description: "Code of location subtype",
          },
          roadJunction: {
            type: "string",
            description:
              "Roadnumber for roads. Junctionno: the numbering of exits has only just begun on the very limited Finnish motorway network. The exit numbers will be included. NOTE: the roads, segments and points are not sorted in ascending order",
          },
          roadName: {
            type: "string",
            description: "Roadname if exists, L5.0 always have road name",
          },
          firstName: {
            type: "string",
            description:
              "For roads and segments this is the name of the starting point. For all other objects (linear (streets), area and point) this is the name of the object",
          },
          secondName: {
            type: "string",
            description:
              "For roads and segments this is the name of the ending point. For point locations the number of the intersecting road",
          },
          areaRef: {
            type: "integer",
            description: "Code of the upper order administrative area",
            format: "int32",
          },
          linearRef: {
            type: "integer",
            description:
              "For segments and point locations. Describes the code of the segment which these objects belong to. If there are no segments on the road the location code of the road is given instead",
            format: "int32",
          },
          negOffset: {
            type: "integer",
            description:
              "For segments and point locations. Segments: describes the code of previous segment on that road. For the first segment on the road this code is 0. Points: describes the code of previous point on that road. For the starting point this code is 0",
            format: "int32",
          },
          posOffset: {
            type: "integer",
            description:
              "For segments and point locations. Segments: describes the code of next segment on that road. For the last segment on the road this code is 0. Points: describes the code of next point on that road. For the last point this code is 0",
            format: "int32",
          },
          urban: {
            type: "boolean",
            description:
              "Indicates whether a point is within the city limits (1) or not (0). NOTE: Not actively entered yet",
          },
          coordinatesETRS89: {
            type: "array",
            description:
              "Point coordinates (LONGITUDE, LATITUDE). Coordinates are in ETRS89 / ETRS-TM35FIN format.",
            items: {
              type: "number",
              description:
                "Point coordinates (LONGITUDE, LATITUDE). Coordinates are in ETRS89 / ETRS-TM35FIN format.",
              format: "double",
            },
          },
          negDirection: {
            type: "string",
            description:
              "For all L5.0 and for some roads. Text to be used when the incident has an effect only on vehicles driving in the negative direction of the road. ( e.g. Ring 1 westbound)",
          },
          posDirection: {
            type: "string",
            description:
              "For all L5.0 and for some roads. Text to be used when the incident has an effect only on vehicles driving in the positive direction of the road. ( e.g. Ring 1 eastbound)",
          },
          geocode: {
            type: "string",
            description:
              "Point location according to Finnish Transport Agency’s official addressing where Locations on road network are addressed as: Road number;Road part number;Carriageway; Distance from the beginning of the road part",
          },
          orderOfPoint: {
            type: "string",
            description: "The order of point within line or segment feature",
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
          locationVersion: { type: "string", description: "Location version" },
        },
        description: "Location GeoJSON properties object",
      },
      LocationVersionDtoV1: {
        required: ["dataUpdatedTime", "version"],
        type: "object",
        properties: {
          version: { type: "string", description: "Location version string" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
        },
        description: "Location Version Object",
      },
      LocationSubtypeDtoV1: {
        required: ["descriptionEn", "descriptionFi", "subtypeCode"],
        type: "object",
        properties: {
          subtypeCode: {
            type: "string",
            description: "Code of location subtype",
          },
          descriptionFi: {
            type: "string",
            description: "Description of subtype in finnish",
          },
          descriptionEn: {
            type: "string",
            description: "Description of subtype in english",
          },
        },
        description: "Location subtype",
      },
      LocationTypeDtoV1: {
        required: ["descriptionEn", "descriptionFi", "typeCode"],
        type: "object",
        properties: {
          typeCode: { type: "string", description: "Code of location type" },
          descriptionFi: {
            type: "string",
            description: "Description of type in finnish",
          },
          descriptionEn: {
            type: "string",
            description: "Description of type in english",
          },
        },
        description: "Location type",
      },
      LocationTypesDtoV1: {
        required: [
          "dataUpdatedTime",
          "locationSubtypes",
          "locationTypes",
          "version",
        ],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
          version: {
            type: "string",
            description: "Version of TMS/Alert-C material",
          },
          locationTypes: {
            type: "array",
            description: "Location types",
            items: { $ref: "#/components/schemas/LocationTypeDtoV1" },
          },
          locationSubtypes: {
            type: "array",
            description: "Location subtypes",
            items: { $ref: "#/components/schemas/LocationSubtypeDtoV1" },
          },
        },
        description: "TMS/Alert-C Location types and location subtypes",
      },
      RegionGeometryFeatureCollectionV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: { $ref: "#/components/schemas/RegionGeometryFeatureV1" },
          },
        },
        description: "GeoJSON Feature Collection of Region Geometries",
      },
      RegionGeometryFeatureV1: {
        required: ["geometry", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          geometry: {
            oneOf: [
              { $ref: "#/components/schemas/LineString" },
              { $ref: "#/components/schemas/MultiLineString" },
              { $ref: "#/components/schemas/MultiPoint" },
              { $ref: "#/components/schemas/MultiPolygon" },
              { $ref: "#/components/schemas/Point" },
              { $ref: "#/components/schemas/Polygon" },
            ],
          },
          properties: {
            $ref: "#/components/schemas/RegionGeometryPropertiesV1",
          },
        },
        description: "Region area GeoJSON Feature object",
      },
      RegionGeometryPropertiesV1: {
        required: ["effectiveDate", "locationCode", "name", "type"],
        type: "object",
        properties: {
          locationCode: {
            type: "integer",
            description: "The Alert-C code of the region",
            format: "int32",
          },
          name: { type: "string", description: "The name of the region" },
          type: { $ref: "#/components/schemas/AreaTypeV1" },
          effectiveDate: {
            type: "string",
            description: "The moment, when the data comes into effect",
            format: "date-time",
          },
        },
        description: "Region geometry properties",
      },
      TmsStationFeatureCollectionSimpleV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: { $ref: "#/components/schemas/TmsStationFeatureSimpleV1" },
          },
        },
        description: "GeoJSON feature collection of TMS stations",
      },
      TmsStationFeatureSimpleV1: {
        required: ["geometry", "id", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          geometry: { $ref: "#/components/schemas/Point" },
          properties: {
            $ref: "#/components/schemas/TmsStationPropertiesSimpleV1",
          },
        },
        description:
          "Tms station GeoJSON Feature object with basic information",
      },
      TmsStationPropertiesSimpleV1: {
        required: ["id", "tmsNumber"],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          tmsNumber: {
            type: "integer",
            description: "TMS station number (naturalId) for legacy support",
            format: "int64",
          },
          name: { type: "string", description: "Common name of road station" },
          collectionStatus: {
            type: "string",
            description: "Data collection status",
            enum: ["GATHERING", "REMOVED_TEMPORARILY", "REMOVED_PERMANENTLY"],
          },
          state: {
            type: "string",
            description: "Road station state",
            enum: [
              "OK",
              "OK_FAULT_DOUBT_CANCELLED",
              "FAULT_DOUBT",
              "FAULT_CONFIRMED",
              "FAULT_CONFIRMED_NOT_FIXED_IN_NEAR_FUTURE",
              "REPAIR_REQUEST_POSTED",
              "REPAIR_MAINTENANCE_DONE",
              "REPAIR_INTERRUPTED",
            ],
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
        },
        description: "Tms station properties object with basic information",
      },
      TmsStationFeatureDetailedV1: {
        required: ["geometry", "id", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          geometry: { $ref: "#/components/schemas/Point" },
          properties: {
            $ref: "#/components/schemas/TmsStationPropertiesDetailedV1",
          },
        },
        description:
          " Tms station GeoJSON feature object with detailed information",
      },
      TmsStationPropertiesDetailedV1: {
        required: [
          "direction1Municipality",
          "direction2Municipality",
          "id",
          "tmsNumber",
        ],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          tmsNumber: {
            type: "integer",
            description: "TMS station number",
            format: "int64",
          },
          name: { type: "string", description: "Common name of road station" },
          collectionStatus: {
            type: "string",
            description: "Data collection status",
            enum: ["GATHERING", "REMOVED_TEMPORARILY", "REMOVED_PERMANENTLY"],
          },
          state: {
            type: "string",
            description: "Road station state",
            enum: [
              "OK",
              "OK_FAULT_DOUBT_CANCELLED",
              "FAULT_DOUBT",
              "FAULT_CONFIRMED",
              "FAULT_CONFIRMED_NOT_FIXED_IN_NEAR_FUTURE",
              "REPAIR_REQUEST_POSTED",
              "REPAIR_MAINTENANCE_DONE",
              "REPAIR_INTERRUPTED",
            ],
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          collectionInterval: {
            type: "integer",
            description: "Data collection interval [s]",
            format: "int32",
          },
          names: {
            type: "object",
            additionalProperties: {
              type: "string",
              description: "Map of names [fi, sv, en]",
              example:
                '{"fi":"Tie 7 Porvoo, Harabacka","sv":"Väg 7 Borgå, Harabacka","en":"Road 7 Porvoo, Harabacka"}',
            },
            description: "Map of names [fi, sv, en]",
            example: {
              fi: "Tie 7 Porvoo, Harabacka",
              sv: "Väg 7 Borgå, Harabacka",
              en: "Road 7 Porvoo, Harabacka",
            },
          },
          roadAddress: { $ref: "#/components/schemas/StationRoadAddressV1" },
          liviId: { type: "string", description: "Id in road registry" },
          country: {
            type: "string",
            description: "Country where station is located",
          },
          startTime: {
            type: "string",
            description: "Station established date time",
            format: "date-time",
          },
          repairMaintenanceTime: {
            type: "string",
            description: "Repair maintenance date time",
            format: "date-time",
          },
          annualMaintenanceTime: {
            type: "string",
            description: "Annual maintenance date time",
            format: "date-time",
          },
          purpose: {
            type: "string",
            description: "Purpose of the road station",
          },
          municipality: { type: "string", description: "Municipality" },
          municipalityCode: {
            type: "integer",
            description: "Municipality code",
            format: "int32",
          },
          province: { type: "string", description: "Province" },
          provinceCode: {
            type: "integer",
            description: "Province code",
            format: "int32",
          },
          direction1Municipality: {
            type: "string",
            description:
              "Direction 1 municipality (1 = According to the road register address increasing direction. I.e. on the road 4 to Lahti, if we are in Korso.)",
          },
          direction1MunicipalityCode: {
            type: "integer",
            description: "Direction 1 municipality code",
            format: "int32",
          },
          direction2Municipality: {
            type: "string",
            description:
              "Direction 2 municipality (2 = According to the road register address decreasing direction. I.e. on the road 4 to Helsinki, if we are in Korso.)",
          },
          direction2MunicipalityCode: {
            type: "integer",
            description: "Direction 2 municipality code",
            format: "int32",
          },
          stationType: {
            type: "string",
            description: "TMS station type",
            enum: ["DSL_4", "DSL_6", "E_18", "LML_1", "OLD", "DSL", "FINAVIA"],
          },
          calculatorDeviceType: {
            type: "string",
            description: "Type of calculation device",
            enum: ["DSL_3", "DSL_4_L", "DSL_4_G", "DSL_5", "OTHER"],
          },
          sensors: {
            type: "array",
            description: "Tms Station Sensors ids",
            items: {
              type: "integer",
              description: "Tms Station Sensors ids",
              format: "int64",
            },
          },
          freeFlowSpeed1: {
            type: "number",
            description: "Free flow speed to direction 1 [km/h]",
            format: "double",
          },
          freeFlowSpeed2: {
            type: "number",
            description: "Free flow speed to direction 2 [km/h]",
            format: "double",
          },
        },
        description: "Tms station properties object with basic information",
      },
      "Sensor constant value": {
        required: ["name", "validFrom", "validTo", "value"],
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the sensor constant" },
          value: {
            type: "integer",
            description: "Value of the sensor constant",
            format: "int32",
          },
          validFrom: {
            type: "string",
            description:
              "Validity start in format mm-dd ie. value 01-31 is 31th of January",
          },
          validTo: {
            type: "string",
            description:
              "Validity end in format mm-dd ie. value 01-31 is 31th of January",
          },
        },
        description: "TMS Stations sensor constant values",
      },
      TmsStationSensorConstantDtoV1: {
        required: ["id", "sensorConstantValues"],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          sensorConstantValues: {
            type: "array",
            description: "TMS Stations sensor constant values",
            items: { $ref: "#/components/schemas/Sensor constant value" },
          },
        },
        description: "Sensor constant values of TMS Station",
      },
      TmsStationDataDtoV1: {
        required: ["id", "sensorValues", "tmsNumber"],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Id of the road station",
            format: "int64",
          },
          tmsNumber: {
            type: "integer",
            description: "TMS station number",
            format: "int64",
          },
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          sensorValues: {
            type: "array",
            description: "Measured sensor values of the station",
            items: { $ref: "#/components/schemas/SensorValueDtoV1" },
          },
        },
        description: "TMS station data with sensor values",
      },
      TmsStationsSensorConstantsDataDtoV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          stations: {
            type: "array",
            description: "Stations data",
            items: {
              $ref: "#/components/schemas/TmsStationSensorConstantDtoV1",
            },
          },
        },
        description: "Latest sensor constant values of TMS stations",
      },
      TmsStationsDataDtoV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Time when data was last updated",
            format: "date-time",
          },
          stations: {
            type: "array",
            description: "Stations data",
            items: { $ref: "#/components/schemas/TmsStationDataDtoV1" },
          },
        },
        description: "Latest measurement data from TMS stations",
      },
      TmsStationSensorDtoV1: {
        required: ["id"],
        type: "object",
        properties: {
          id: { type: "integer", description: "Sensor id", format: "int64" },
          name: { type: "string", description: "Sensor name [fi]" },
          shortName: {
            type: "string",
            description: "Short name for sensor [fi]",
          },
          unit: { type: "string", description: "Unit of sensor value" },
          accuracy: {
            type: "integer",
            description: "Sensor accuracy",
            format: "int32",
          },
          sensorValueDescriptions: {
            type: "array",
            description: "Descriptions for sensor values",
            items: { $ref: "#/components/schemas/SensorValueDescription" },
          },
          presentationNames: {
            type: "object",
            additionalProperties: {
              type: "string",
              description: "Map of presentation names [fi, sv, en]",
            },
            description: "Map of presentation names [fi, sv, en]",
          },
          descriptions: {
            type: "object",
            additionalProperties: {
              type: "string",
              description: "Map of sensor descriptions [fi, sv, en]",
            },
            description: "Map of sensor descriptions [fi, sv, en]",
          },
          direction: {
            $ref: "#/components/schemas/RoadStationSensorDirection",
          },
          description: {
            type: "string",
            description: "Sensor description [fi]",
          },
        },
        description: "TMS road station sensor",
      },
      TmsStationSensorsDtoV1: {
        required: ["dataLastCheckedTime", "dataUpdatedTime", "sensors"],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          dataLastCheckedTime: {
            type: "string",
            description: "Data last checked date time",
            format: "date-time",
          },
          sensors: {
            type: "array",
            description: "Available sensors of road stations",
            items: { $ref: "#/components/schemas/TmsStationSensorDtoV1" },
          },
        },
        description: "Available sensors of TMS stations",
      },
      MaintenanceTrackingTaskDtoV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          id: { type: "string" },
          nameFi: { type: "string" },
          nameEn: { type: "string" },
          nameSv: { type: "string" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
        },
        description: "Maintenance tracking task",
      },
      MaintenanceTrackingFeatureCollectionV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: {
              $ref: "#/components/schemas/MaintenanceTrackingFeatureV1",
            },
          },
        },
        description: "GeoJSON Feature Collection of maintenance trackings",
      },
      MaintenanceTrackingFeatureV1: {
        required: ["geometry", "properties", "type"],
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "GeoJSON Feature Object",
            enum: ["Feature"],
          },
          properties: {
            $ref: "#/components/schemas/MaintenanceTrackingPropertiesV1",
          },
          geometry: {
            oneOf: [
              { $ref: "#/components/schemas/LineString" },
              { $ref: "#/components/schemas/MultiLineString" },
              { $ref: "#/components/schemas/MultiPoint" },
              { $ref: "#/components/schemas/MultiPolygon" },
              { $ref: "#/components/schemas/Point" },
              { $ref: "#/components/schemas/Polygon" },
            ],
          },
        },
        description: "GeoJSON Feature Object of maintenance tracking.",
      },
      MaintenanceTrackingPropertiesV1: {
        required: [
          "created",
          "endTime",
          "id",
          "sendingTime",
          "startTime",
          "tasks",
        ],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Id for the tracking",
            format: "int64",
          },
          previousId: {
            type: "integer",
            description: "Id for the previous tracking if known",
            format: "int64",
          },
          sendingTime: {
            type: "string",
            description: "Time when tracking was reported",
            format: "date-time",
          },
          created: {
            type: "string",
            description: "Creation time of tracking",
            format: "date-time",
          },
          tasks: {
            uniqueItems: true,
            type: "array",
            description: "Tasks done during maintenance work",
            items: {
              type: "string",
              description: "Tasks done during maintenance work",
              enum: [
                "BRUSHING",
                "BRUSH_CLEARING",
                "CLEANSING_OF_BRIDGES",
                "CLEANSING_OF_REST_AREAS",
                "CLEANSING_OF_TRAFFIC_SIGNS",
                "CLIENTS_QUALITY_CONTROL",
                "COMPACTION_BY_ROLLING",
                "CRACK_FILLING",
                "DITCHING",
                "DUST_BINDING_OF_GRAVEL_ROAD_SURFACE",
                "FILLING_OF_GRAVEL_ROAD_SHOULDERS",
                "FILLING_OF_ROAD_SHOULDERS",
                "HEATING",
                "LEVELLING_GRAVEL_ROAD_SURFACE",
                "LEVELLING_OF_ROAD_SHOULDERS",
                "LEVELLING_OF_ROAD_SURFACE",
                "LINE_SANDING",
                "LOWERING_OF_SNOWBANKS",
                "MAINTENANCE_OF_GUIDE_SIGNS_AND_REFLECTOR_POSTS",
                "MECHANICAL_CUT",
                "MIXING_OR_STABILIZATION",
                "OTHER",
                "PATCHING",
                "PAVING",
                "PLOUGHING_AND_SLUSH_REMOVAL",
                "PREVENTING_MELTING_WATER_PROBLEMS",
                "REMOVAL_OF_BULGE_ICE",
                "RESHAPING_GRAVEL_ROAD_SURFACE",
                "ROAD_INSPECTIONS",
                "ROAD_MARKINGS",
                "ROAD_STATE_CHECKING",
                "SAFETY_EQUIPMENT",
                "SALTING",
                "SNOW_PLOUGHING_STICKS_AND_SNOW_FENCES",
                "SPOT_SANDING",
                "SPREADING_OF_CRUSH",
                "TRANSFER_OF_SNOW",
                "UNKNOWN",
              ],
            },
          },
          startTime: {
            type: "string",
            description: "Start time of maintenance work tasks",
            format: "date-time",
          },
          endTime: {
            type: "string",
            description: "End time of maintenance work tasks",
            format: "date-time",
          },
          direction: {
            type: "number",
            description: "Direction of the last observation",
          },
          domain: { type: "string", description: "Domain of the data" },
          source: {
            type: "string",
            description: "Source and owner of the data",
          },
        },
        description: "Maintenance tracking properties",
      },
      MaintenanceTrackingLatestFeatureCollectionV1: {
        required: ["dataUpdatedTime", "features", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated date time",
            format: "date-time",
          },
          features: {
            type: "array",
            description: "GeoJSON Feature Objects",
            items: {
              $ref: "#/components/schemas/MaintenanceTrackingLatestFeatureV1",
            },
          },
        },
        description:
          "GeoJSON Feature Collection of maintenance trackings latest values",
      },
      MaintenanceTrackingLatestFeatureV1: {
        required: ["geometry", "properties", "type"],
        type: "object",
        properties: {
          type: { type: "string", description: "GeoJSON Object Type" },
          properties: {
            $ref: "#/components/schemas/MaintenanceTrackingLatestPropertiesV1",
          },
          geometry: {
            oneOf: [
              { $ref: "#/components/schemas/LineString" },
              { $ref: "#/components/schemas/MultiLineString" },
              { $ref: "#/components/schemas/MultiPoint" },
              { $ref: "#/components/schemas/MultiPolygon" },
              { $ref: "#/components/schemas/Point" },
              { $ref: "#/components/schemas/Polygon" },
            ],
          },
        },
        description: "GeoJSON Feature Object of latest maintenance tracking.",
      },
      MaintenanceTrackingLatestPropertiesV1: {
        required: ["created", "id", "tasks", "time"],
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Id for the tracking",
            format: "int64",
          },
          time: {
            type: "string",
            description: "Time of latest tracking",
            format: "date-time",
          },
          created: {
            type: "string",
            description: "Creation time of tracking",
            format: "date-time",
          },
          tasks: {
            uniqueItems: true,
            type: "array",
            description: "Tasks done during maintenance work",
            items: {
              type: "string",
              description: "Tasks done during maintenance work",
              enum: [
                "BRUSHING",
                "BRUSH_CLEARING",
                "CLEANSING_OF_BRIDGES",
                "CLEANSING_OF_REST_AREAS",
                "CLEANSING_OF_TRAFFIC_SIGNS",
                "CLIENTS_QUALITY_CONTROL",
                "COMPACTION_BY_ROLLING",
                "CRACK_FILLING",
                "DITCHING",
                "DUST_BINDING_OF_GRAVEL_ROAD_SURFACE",
                "FILLING_OF_GRAVEL_ROAD_SHOULDERS",
                "FILLING_OF_ROAD_SHOULDERS",
                "HEATING",
                "LEVELLING_GRAVEL_ROAD_SURFACE",
                "LEVELLING_OF_ROAD_SHOULDERS",
                "LEVELLING_OF_ROAD_SURFACE",
                "LINE_SANDING",
                "LOWERING_OF_SNOWBANKS",
                "MAINTENANCE_OF_GUIDE_SIGNS_AND_REFLECTOR_POSTS",
                "MECHANICAL_CUT",
                "MIXING_OR_STABILIZATION",
                "OTHER",
                "PATCHING",
                "PAVING",
                "PLOUGHING_AND_SLUSH_REMOVAL",
                "PREVENTING_MELTING_WATER_PROBLEMS",
                "REMOVAL_OF_BULGE_ICE",
                "RESHAPING_GRAVEL_ROAD_SURFACE",
                "ROAD_INSPECTIONS",
                "ROAD_MARKINGS",
                "ROAD_STATE_CHECKING",
                "SAFETY_EQUIPMENT",
                "SALTING",
                "SNOW_PLOUGHING_STICKS_AND_SNOW_FENCES",
                "SPOT_SANDING",
                "SPREADING_OF_CRUSH",
                "TRANSFER_OF_SNOW",
                "UNKNOWN",
              ],
            },
          },
          direction: {
            type: "number",
            description: "Direction of the last observation",
          },
          domain: { type: "string", description: "Domain of the data" },
          source: {
            type: "string",
            description: "Source and owner of the data",
          },
        },
        description: "Maintenance tracking properties",
      },
      MaintenanceTrackingDomainDtoV1: {
        required: ["dataUpdatedTime", "name", "source"],
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the maintenance tracking domain",
          },
          source: {
            type: "string",
            description: "Source and owner of the data",
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
        },
        description: "Maintenance tracking domain",
      },
      UpdateInfoDtoV1: {
        required: ["api", "dataUpdatedTime"],
        type: "object",
        properties: {
          api: { type: "string", description: "Url of the API" },
          subtype: {
            type: "string",
            description: "More specific info about API. Ie. domain info.",
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
          dataCheckedTime: {
            type: "string",
            description:
              "Latest check for data updates.  <br>\n`null` value indicates data being pushed to our platform or data is static and is only updated when needed.",
            format: "date-time",
          },
          dataUpdateInterval: {
            type: "string",
            description:
              "Data update interval in ISO-8601 duration format `PnDTnHnMn.nS`. <br>\nIf the interval is `P0S` that means that data is updated nearly in real time. <br>\nIf value is `null` then data is static and it is only updated when needed.",
            example: "[PT5M, P1H]",
          },
          recommendedFetchInterval: {
            type: "string",
            description:
              "Recommended fetch interval for clients in ISO-8601 duration format `PnDTnHnMn.nS`",
            example: "[PT5M, P1H]",
          },
        },
        description: "Info about API's data updates",
      },
      UpdateInfosDtoV1: {
        required: ["dataUpdatedTime"],
        type: "object",
        properties: {
          dataUpdatedTime: {
            type: "string",
            description: "Data last updated time",
            format: "date-time",
          },
          updateTimes: {
            type: "array",
            description: "Update times for APIs",
            items: { $ref: "#/components/schemas/UpdateInfoDtoV1" },
          },
        },
        description: "Infos about APIs' data updates",
      },
      CSVDataModel: { type: "object" },
      CountersModel: {
        required: ["features", "type"],
        type: "object",
        properties: {
          features: {
            type: "array",
            items: { $ref: "#/components/schemas/CounterFeatureModel" },
          },
          type: {
            type: "string",
            description: "FeatureCollection",
            enum: ["FeatureCollection"],
          },
          dataUpdatedTime: {
            type: "string",
            description: "Data updated timestamp",
            format: "date-time",
          },
        },
        description: "GeoJson FeatureCollection",
      },
      Empty: { title: "Empty Schema", type: "object" },
      JsonDataResponseModel: {
        type: "array",
        description: "Counting Site data",
        items: {
          type: "object",
          properties: {
            dataTimestamp: {
              type: "string",
              description: "Data interval start",
              format: "date-time",
            },
            count: { type: "number", description: "Counter count" },
            interval: {
              type: "number",
              description: "Interval length in minutes",
            },
            status: { type: "number", description: "Counter status" },
          },
        },
      },
      CounterFeatureModel: {
        required: ["geometry", "properties", "type"],
        type: "object",
        properties: {
          geometry: { type: "object", description: "GeoJSON geometry" },
          type: { type: "string", description: "Feature", enum: ["Feature"] },
          properties: { $ref: "#/components/schemas/CounterModel" },
        },
        description: "GeoJson Feature",
      },
      UserTypesResponseModel: {
        type: "object",
        description: "Counting Site Usertype",
      },
      CounterModel: {
        type: "object",
        properties: {
          domain: { type: "string", description: "Domain name" },
          name: { type: "string", description: "Counter name" },
          interval: {
            type: "integer",
            description: "Data recording interval in minutes",
          },
          lastDataTimestamp: {
            type: "string",
            description: "Timestamp of last data",
            format: "date-time",
          },
          removedTimestamp: {
            type: "string",
            description: "Removal timestamp",
            format: "date-time",
          },
          id: { type: "integer", description: "Counter id" },
          userType: { type: "integer", description: "Counter type" },
          dataUpdatedTime: {
            type: "string",
            description: "Data updated timestamp",
            format: "date-time",
          },
          direction: { type: "integer", description: "Counter direction" },
        },
        description: "Counting Site Metadata",
      },
      DomainsResponseModel: {
        type: "object",
        properties: {
          addedTimestamp: {
            type: "string",
            description: "Domain added",
            format: "date-time",
          },
          name: {
            type: "string",
            description: "Domain name",
            format: "string",
          },
          description: {
            type: "string",
            description: "Domain description",
            format: "string",
          },
          removedTimestamp: {
            type: "string",
            description: "Domain removed",
            format: "date-time",
          },
        },
        description: "Counting Site Domain",
      },
      SvgModel: { type: "object" },
      XmlModel: { type: "object" },
      WeatherSensorValueHistoryDto: {
        type: "object",
        properties: {
          roadStationId: {
            type: "integer",
            description: "Road station id",
            format: "int64",
          },
          sensorId: {
            type: "integer",
            description: "Sensor id",
            format: "int64",
          },
          sensorValue: {
            type: "number",
            description: "Sensor value",
            format: "double",
          },
          measured: { type: "string", format: "date-time", writeOnly: true },
          measuredTime: {
            type: "string",
            description: "Value's measured date time",
            format: "date-time",
          },
        },
      },
    },
    securitySchemes: {
      api_key: { type: "apiKey", name: "x-api-key", in: "header" },
    },
  },
} as const;
