import type { Service } from "./service.js";

/**
 * MonitoredEndpoints represents the API endpoints we collect metrics for.
 */
export interface MonitoredEndpoints {
  readonly service: Service;
  readonly endpoints: Set<string>;
}

export function createMonitoredEndpoints(
  service: Service,
  endpoints: Set<string>,
): MonitoredEndpoints {
  return { service, endpoints };
}
