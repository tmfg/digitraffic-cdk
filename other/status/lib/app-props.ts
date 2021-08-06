export enum EndpointProtocol {
    HTTP,
    WebSocket
}

export interface MonitoredEndpoint {
    readonly name: string
    readonly url: string
    readonly protocol: EndpointProtocol
    readonly sendData?: any
}

export interface MonitoredApp {
    readonly name: string
    readonly hostPart: string
    readonly url: string
    readonly endpoints: MonitoredEndpoint[]
    readonly excluded: string[]
}

export interface Props {
    readonly defaultLambdaDurationSeconds: number
    readonly logsDestinationArn: string
    readonly secretsManagerSecretArn: string
    readonly monitoredApps: MonitoredApp[]
    readonly allowFromIpAddresses: string[]
    readonly statusPageUrl: string
}
