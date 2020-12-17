export enum EndpointProtocol {
    HTTP,
    WebSocket
}

export interface MonitoredEndpoint {
    readonly name: string
    readonly url: string
    readonly protocol: EndpointProtocol
}

export interface MonitoredApp {
    readonly name: string
    readonly url: string
    readonly endpoints: MonitoredEndpoint[]
}

export interface Props {
    defaultLambdaDurationSeconds: number
    logsDestinationArn: string
    secretsManagerSecretArn: string
    monitoredApps: MonitoredApp[]
    allowFromIpAddresses: string[]
}
