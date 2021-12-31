export enum EndpointProtocol {
    HTTP,
    WebSocket
}

export enum EndpointHttpMethod {
    GET = 'GET',
    HEAD = 'HEAD',
    POST = 'POST'
}

export type MonitoredEndpoint = {
    readonly name: string
    readonly url: string
    readonly protocol: EndpointProtocol
    readonly method?: EndpointHttpMethod
    readonly sendData?: any
}

export type MonitoredApp = {
    readonly name: string
    readonly hostPart: string
    readonly url: string
    readonly endpoints: MonitoredEndpoint[]
    readonly excluded: string[]
}

export type Props = {
    readonly defaultLambdaDurationSeconds: number
    readonly logsDestinationArn: string
    readonly secretsManagerSecretArn: string
    readonly nodePingTimeoutSeconds: number
    readonly nodePingCheckInterval: number
    readonly monitoredApps: MonitoredApp[]
    readonly allowFromIpAddresses: string[]
    readonly statusPageUrl: string
}
