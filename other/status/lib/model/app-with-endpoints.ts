import { MonitoredEndpoint } from "../app-props";

export interface AppWithEndpoints {
    readonly app: string;
    readonly hostPart: string;
    readonly endpoints: string[];
    readonly extraEndpoints: MonitoredEndpoint[];
}
