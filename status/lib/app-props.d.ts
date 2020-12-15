export interface MonitoredApp {
    readonly name: string
    readonly url: string
}

export interface Props {
    defaultLambdaDurationSeconds: number
    logsDestinationArn: string
    secretsManagerSecretArn: string
    monitoredApps: MonitoredApp[]
}
