/**
 * ForFetchingResources is a driven port (secondary port) that defines
 * what the application needs for fetching HTTP resources.
 *
 * Used primarily for fetching OpenAPI specs for endpoint discovery.
 */
export interface ForFetchingResources {
  /**
   * Fetch a resource from a URL and parse it as JSON.
   *
   * @param url - The URL to fetch
   * @returns The parsed JSON response
   */
  fetch<T>(url: string): Promise<T>;
}
