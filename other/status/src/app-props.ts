export enum EndpointProtocol {
    HTTP,
    WebSocket
}

export enum EndpointHttpMethod {
    GET = "GET",
    HEAD = "HEAD",
    POST = "POST"
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
    readonly name: string; // i.e. Road
    readonly hostPart: string;
    readonly url: string;
    readonly endpoints: MonitoredEndpoint[];
    readonly excluded: string[];
}

export interface Props {
    readonly defaultLambdaDurationSeconds: number;
    readonly secretId: string;
    readonly nodePingTimeoutSeconds: number;
    readonly nodePingCheckInterval: number;
    readonly monitoredApps: MonitoredApp[];
    readonly allowFromIpAddresses: string[];
    readonly cStatePageUrl: string;
    readonly gitHubRepo: string;
    readonly gitHubOwner: string;
    readonly gitHubBranch: string;
    readonly gitHubWorkflowFile: string;
    readonly gitHubUpdateMaintenanceWorkflowFile: string;
}
