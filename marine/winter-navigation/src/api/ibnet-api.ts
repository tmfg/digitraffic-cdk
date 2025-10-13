import type { EndpointResponse } from "../model/apidata.js";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";

export type ApiPath =
  | "location"
  | "restriction"
  | "vessel"
  | "activity"
  | "source"
  | "port-suspension"
  | "port-suspension-location"
  | "queue"
  | "dirway"
  | "dirwaypoint";

export class IbnetApi {
  private _baseUrl: string;
  private _authHeaderValue: string;

  constructor(baseUrl: string, authHeaderValue: string) {
    this._baseUrl = baseUrl;
    this._authHeaderValue = authHeaderValue;
  }

  async fetchFromUrl<T>(url: string): Promise<T> {
    logger.debug("Fetching from " + url);

    return ky
      .get(url, {
        timeout: 20000,
        headers: {
          Authorization: `Basic ${this._authHeaderValue}`,
          Accept: MediaType.APPLICATION_JSON,
        },
      })
      .then(async (resp) => {
        if (resp.status !== 200) {
          logger.error({
            method: "IbnetApi.fetchFromUrl",
            customStatus: resp.status,
            customDetails: resp.statusText,
          });

          throw new Error("Fetching failed");
        }

        return await resp.json<T>();
      })
      .catch((error) => {
        logger.debug("error:" + JSON.stringify(error));
        throw error;
      });
  }

  async fetch<T>(path: ApiPath, from: number, to: number): Promise<T[]> {
    const start = Date.now();
    const url = `${this._baseUrl}${path}?from=${from}&to=${to}`;

    try {
      return await this.fetchFromUrl<T[]>(url);
    } catch (error) {
      logException(logger, error);

      return [];
    } finally {
      logger.info({
        method: "IbnetApi.fetch",
        tookMs: Date.now() - start,
      });
    }
  }

  async getCurrentVersion(): Promise<number> {
    const response: EndpointResponse = await this.fetchFromUrl(this._baseUrl);

    return response.toRv;
  }
}
