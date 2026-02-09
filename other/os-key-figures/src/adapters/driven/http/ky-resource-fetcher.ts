import ky from "ky";
import type { ForFetchingResources } from "../../../ports/driven/for-fetching-resources.js";

/**
 * KyResourceFetcher implements ForFetchingResources using the ky HTTP client.
 */
export class KyResourceFetcher implements ForFetchingResources {
  private readonly retryLimit: number;
  private readonly timeout: number;

  constructor(options?: { retryLimit?: number; timeout?: number }) {
    this.retryLimit = options?.retryLimit ?? 3;
    this.timeout = options?.timeout ?? 30000;
  }

  async fetch<T>(url: string): Promise<T> {
    return ky
      .get(url, {
        retry: {
          limit: this.retryLimit,
          methods: ["get"],
          statusCodes: [408, 429, 500, 502, 503, 504],
        },
        timeout: this.timeout,
      })
      .json<T>();
  }
}
