import type { Service } from "./service.js";

/**
 * MetricScope defines what we're collecting metrics for.
 * It identifies a service and optionally a specific endpoint.
 */
export interface MetricScope {
  /** The service to collect metrics for */
  readonly service: Service;

  /** Optional specific endpoint path (e.g., "/api/v1/trains/") */
  readonly endpoint?: string;

  /** Legacy identifier used for database storage (used by downstream apps) */
  readonly storageTag: string;
}

/**
 * Creates a MetricScope for a service-level metric (no specific endpoint).
 */
export function createServiceScope(service: Service): MetricScope {
  return {
    service,
    storageTag: `@transport_type:${service}`,
  };
}

/**
 * Creates a MetricScope for an endpoint-level metric.
 */
export function createEndpointScope(
  service: Service,
  endpoint: string,
): MetricScope {
  return {
    service,
    endpoint,
    storageTag: `@transport_type:${service} AND @fields.request_uri:"${endpoint}"`,
  };
}
