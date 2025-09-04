import {
  EndpointHttpMethod,
  EndpointProtocol,
  type MonitoredApp,
} from "./app-props.js";

export const monitoredApps: MonitoredApp[] = [
  {
    name: "Road",
    hostPart: "https://tie.digitraffic.fi",
    url: "https://tie.digitraffic.fi/swagger/openapi.json",
    excluded: [
      // query parameter required
      "/api/variable-sign/v1/signs/history",
      // timeout
      "/api/maintenance/v1/tracking/routes",
      // response too large
      "/api/weather/v1/forecast-sections",
      "/api/weather/v1/forecast-sections/forecasts",
    ],
    endpoints: [
      {
        name: "Road MQTT",
        url: "wss://tie.digitraffic.fi/mqtt",
        protocol: EndpointProtocol.WebSocket,
      },
      {
        name: "Road Weathercam",
        url: "https://weathercam.digitraffic.fi/C0460900.jpg",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Road Swagger UI",
        url: "https://tie.digitraffic.fi/swagger/",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Road TMS history UI",
        url: "https://tie.digitraffic.fi/ui/tms/history/",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Road TMS history API",
        url:
          "https://tie.digitraffic.fi/api/tms/v1/history?api=liikennemaara&tyyppi=vrk&pvm=2023-03-01&loppu=2023-03-01&lam_type=option1&piste=1",
        protocol: EndpointProtocol.HTTP,
        method: EndpointHttpMethod.GET,
        //contentstring: "vt7_Rita" this is not working and head is not supported
      },
      // This is for raw-data from ongoing or history S3 bucket.
      // History-bucket has data until end of 2021 and ongoing-bucket has data from start of the 2022.
      // Here we test only later as we don't want multiple of these on status page
      // {
      //     name: "Road tms history raw old API",
      //     url: "https://tie.digitraffic.fi/api/tms/v1/history/raw/lamraw_101_20_32.csv",
      //     protocol: EndpointProtocol.HTTP,
      //     contentstring: "101"
      // },
      {
        name: "/api/tms/v1/history/raw",
        url:
          "https://tie.digitraffic.fi/api/tms/v1/history/raw/lamraw_101_23_359.csv",
        protocol: EndpointProtocol.HTTP,
        method: EndpointHttpMethod.GET,
        contentstring: "101",
      },
      {
        name: "/api/maintenance/v1/tracking/routes",
        url:
          "https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes?xMax=20&xMin=19&yMax=60&yMin=59",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "/api/weather/v1/forecast-sections",
        url:
          "https://tie.digitraffic.fi/api/weather/v1/forecast-sections/00001_001_00000_2_0",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "/api/weather/v1/forecast-sections/forecasts",
        url:
          "https://tie.digitraffic.fi/api/weather/v1/forecast-sections/00001_001_00000_2_0/forecasts",
        protocol: EndpointProtocol.HTTP,
      },
    ],
  },
  {
    name: "Marine",
    hostPart: "https://meri.digitraffic.fi",
    url: "https://meri.digitraffic.fi/swagger/openapi.json",
    excluded: [],
    endpoints: [
      {
        name: "Marine MQTT",
        url: "wss://meri.digitraffic.fi/mqtt",
        protocol: EndpointProtocol.WebSocket,
      },
      {
        name: "Marine Swagger UI",
        url: "https://meri.digitraffic.fi/swagger/",
        protocol: EndpointProtocol.HTTP,
      },
    ],
  },
  {
    name: "Rail",
    hostPart: "https://rata.digitraffic.fi",
    url: "https://rata.digitraffic.fi/swagger/openapi.json",
    excluded: [],
    endpoints: [
      {
        name: "Rail MQTT",
        url: "wss://rata.digitraffic.fi/mqtt",
        protocol: EndpointProtocol.WebSocket,
      },
      {
        name: "Rail GraphQL",
        url: "https://rata.digitraffic.fi/api/v2/graphql/graphql",
        protocol: EndpointProtocol.HTTP,
        method: EndpointHttpMethod.POST,
        sendData:
          '{"query": "{  latestTrainLocations(orderBy: {timestamp: DESCENDING}, take:1) {    speed    timestamp    location  }}"}',
      },

      {
        name: "Rail GraphiQL",
        url: "https://rata.digitraffic.fi/api/v2/graphql/graphiql",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Rail train history",
        url:
          "https://rata.digitraffic.fi/api/v1/compositions/history/2019-01-01/1",
        protocol: EndpointProtocol.HTTP,
      },

      {
        name: "Rail train history UI",
        url: "https://rata.digitraffic.fi/history/",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Rail infra-api",
        url: "https://rata.digitraffic.fi/infra-api/0.8/revisions.json?count=1",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Rail infra-api UI",
        url: "https://rata.digitraffic.fi/infra-api/",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Rail jeti-api",
        url: "https://rata.digitraffic.fi/jeti-api/0.7/revisions.json?count=1",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Rail jeti-api UI",
        url: "https://rata.digitraffic.fi/jeti-api/",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Rail Swagger UI",
        url: "https://rata.digitraffic.fi/swagger/",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Rail Infra-api Swagger UI",
        url: "https://rata.digitraffic.fi/infra-api/0.7/swagger-ui.html",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Rail data is up to date",
        url: "https://rata.digitraffic.fi/api/v1/last-updated",
        protocol: EndpointProtocol.HTTP,
        method: EndpointHttpMethod.GET,
        contentstring: "false",
        invert: true,
      },
    ],
  },
  {
    name: "Parking",
    hostPart: "https://parking.fintraffic.fi",
    url: "https://parking-test.fintraffic.fi/v3/api-docs",
    excluded: [
      // "/api/v1/utilizations",
      // "/api/v1/regions",
      "/api/v1/regions/withHubs", // 403
      "/api/v1/regions/withFacilities", // 403
      // "/api/v1/operators",
      // "/api/v1/hubs",
      // "/api/v1/facilities",
      "/api/v1/facilities/summary", // This is not yet at production
      // "/api/v1/contacts",
    ],
    endpoints: [
      {
        name: "Parking UI ",
        url: "https://parking.fintraffic.fi/hubs",
        protocol: EndpointProtocol.HTTP,
      },
      {
        name: "Parking Swagger UI",
        url: "https://parking.fintraffic.fi/swagger/swagger-ui/index.html",
        protocol: EndpointProtocol.HTTP,
      },
    ],
  },
];
