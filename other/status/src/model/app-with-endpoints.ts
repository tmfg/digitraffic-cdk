import type { MonitoredEndpoint } from "../app-props.js";

export interface AppWithEndpoints {
  readonly app: string;
  readonly hostPart: string;
  readonly endpoints: string[];
  readonly extraEndpoints: MonitoredEndpoint[];
}
