import {MonitoredEndpoint} from "../app-props";

export type AppEndpoints = {
    readonly app: string
    readonly hostPart: string
    readonly endpoints: string[]
    readonly extraEndpoints: MonitoredEndpoint[]
}
