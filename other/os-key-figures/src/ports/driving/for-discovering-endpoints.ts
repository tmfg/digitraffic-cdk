import type { MonitoredEndpoints } from "../../domain/types/monitored-endpoints.js";
import type { Service } from "../../domain/types/service.js";

/**
 * ForDiscoveringEndpoints is a driving port (primary port) that defines
 * what the application offers for endpoint discovery.
 */
export interface ForDiscoveringEndpoints {
  /**
   * Discover API endpoints for a specific service.
   *
   * @param service - The service to discover endpoints for
   * @returns The monitored endpoints for the service
   */
  discoverEndpoints(service: Service): Promise<MonitoredEndpoints>;

  /**
   * Discover API endpoints for all services.
   *
   * @returns The monitored endpoints for all services
   */
  discoverAllEndpoints(): Promise<MonitoredEndpoints[]>;
}
