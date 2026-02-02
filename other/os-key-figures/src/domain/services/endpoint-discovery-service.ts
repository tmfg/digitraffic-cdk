import type { OpenApiSchema } from "@digitraffic/common/dist/types/openapi-schema";
import { openapiSchema } from "@digitraffic/common/dist/types/openapi-schema";
import type { ForFetchingResources } from "../../ports/driven/for-fetching-resources.js";
import type { ForDiscoveringEndpoints } from "../../ports/driving/for-discovering-endpoints.js";
import { CollectionError } from "../errors/collection-error.js";
import type { MonitoredEndpoints } from "../types/monitored-endpoints.js";
import { createMonitoredEndpoints } from "../types/monitored-endpoints.js";
import { Service } from "../types/service.js";

/**
 * Configuration for endpoint discovery.
 */
export interface EndpointDiscoveryConfig {
  /** Map of service to OpenAPI spec URL */
  readonly openApiUrls: Map<Service, string>;
  /** Map of service to custom (non-OpenAPI) endpoints */
  readonly customEndpoints: Map<Service, string[]>;
}

/**
 * EndpointDiscoveryService implements the ForDiscoveringEndpoints driving port.
 * It discovers API endpoints from OpenAPI specs and custom configurations.
 */
export class EndpointDiscoveryService implements ForDiscoveringEndpoints {
  constructor(
    private readonly httpClient: ForFetchingResources,
    private readonly config: EndpointDiscoveryConfig,
  ) {}

  async discoverEndpoints(service: Service): Promise<MonitoredEndpoints> {
    const endpoints = new Set<string>();

    // Get endpoints from OpenAPI spec
    const openApiUrl = this.config.openApiUrls.get(service);
    if (openApiUrl) {
      const openApiPaths = await this.fetchOpenApiPaths(openApiUrl, service);
      for (const path of openApiPaths) {
        endpoints.add(path);
      }
    }

    // Add custom endpoints
    const customPaths = this.config.customEndpoints.get(service);
    if (customPaths) {
      for (const path of customPaths) {
        endpoints.add(this.normalizePath(path));
      }
    }

    return createMonitoredEndpoints(service, endpoints);
  }

  async discoverAllEndpoints(): Promise<MonitoredEndpoints[]> {
    const services = Object.values(Service).filter(
      (service) => service !== Service.ALL,
    );
    const results: MonitoredEndpoints[] = [];

    for (const service of services) {
      try {
        const endpoints = await this.discoverEndpoints(service);
        results.push(endpoints);
      } catch (error) {
        // Log error but continue with other services
        console.error(`Failed to discover endpoints for ${service}:`, error);
        // Return empty endpoints for failed service
        results.push(createMonitoredEndpoints(service, new Set()));
      }
    }

    return results;
  }

  private async fetchOpenApiPaths(
    url: string,
    service: Service,
  ): Promise<Set<string>> {
    try {
      const spec = await this.httpClient.fetch<unknown>(url);
      const schema: OpenApiSchema = openapiSchema.parse(spec);
      return this.extractPathsFromSchema(schema);
    } catch (error) {
      throw new CollectionError(`Failed to fetch OpenAPI spec from ${url}`, {
        cause: error instanceof Error ? error : new Error(String(error)),
        inputValues: { url, service },
      });
    }
  }

  private extractPathsFromSchema(schema: OpenApiSchema): Set<string> {
    const paths = new Set<string>();

    if (schema.paths) {
      for (const pathsKey in schema.paths) {
        const splitResult = pathsKey.split("{")[0];
        if (!splitResult) {
          throw new Error("Couldn't split the path");
        }
        paths.add(this.normalizePath(splitResult));
      }
    }

    return paths;
  }

  /**
   * Normalize a path to ensure it ends with a trailing slash.
   */
  private normalizePath(path: string): string {
    return path.endsWith("/") ? path : `${path}/`;
  }
}
