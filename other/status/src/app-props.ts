import type { TrafficType } from "@digitraffic/common/dist/types/traffictype";

export enum EndpointProtocol {
  HTTP,
  WebSocket,
}

export enum EndpointHttpMethod {
  GET = "GET",
  HEAD = "HEAD",
  POST = "POST",
}

export interface MonitoredEndpoint {
  readonly name: string;
  readonly url: string;
  readonly protocol: EndpointProtocol;
  readonly method?: EndpointHttpMethod;
  readonly sendData?: string;
  readonly contentstring?: string;
  readonly invert?: boolean;
  readonly regex?: boolean;
}

export interface MonitoredApp {
  readonly name: TrafficType; // e.g. Road
  readonly hostPart: string; // e.g. https://tie.digitraffic.fi
  readonly url: string; // e.g. https://tie.digitraffic.fi/swagger/
  readonly endpoints: MonitoredEndpoint[]; // e.g. [{ name: "Road MQTT", url: "wss://tie.digitraffic.fi/mqtt", protocol: EndpointProtocol.WebSocket }]
  readonly excluded: string[]; // e.g. ["/api/variable-sign/v1/signs/history", "/api/maintenance/v1/tracking/routes"]
  readonly hasOpenApiSpec?: boolean; // e.g. false
}

export interface Props {
  readonly defaultLambdaDurationSeconds: number;
  readonly secretId: string;
  readonly nodePingTimeoutSeconds: number;
  readonly nodePingCheckInterval: number;
  readonly allowFromIpAddresses: string[];
  readonly cStatePageUrl: string;
  readonly gitHubRepo: string;
  readonly gitHubOwner: string;
  readonly gitHubBranch: string;
  readonly gitHubWorkflowFile: string;
  readonly gitHubUpdateMaintenanceWorkflowFile: string;
}
