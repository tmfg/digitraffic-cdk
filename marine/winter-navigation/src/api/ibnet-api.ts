import { logger } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger-default";
import { createKyHooks } from "@digitraffic/common/dist/aws/runtime/logging/http-interceptors";
import { LoggerFactory } from "@digitraffic/common/dist/aws/runtime/logging/http-logger";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";
import type { EndpointResponse } from "../model/api-db-model.js";

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

  readonly _loggerFactory: LoggerFactory;

  constructor(baseUrl: string, authHeaderValue: string) {
    this._baseUrl = baseUrl;
    this._authHeaderValue = authHeaderValue;

    this._loggerFactory = new LoggerFactory({
      context: "Winter-navigation",
      urlTemplate: this.createTemplate(),
    });
  }

  async fetchFromUrl<T>(url: string, urlTemplate?: string): Promise<T> {
    const httpLogger = this._loggerFactory.logger(url, urlTemplate);

    return ky
      .get(url, {
        timeout: 20000,
        headers: {
          Authorization: `Basic ${this._authHeaderValue}`,
          Accept: MediaType.APPLICATION_JSON,
        },
        hooks: createKyHooks(httpLogger),
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
      });
  }

  async fetch<T>(path: ApiPath, from: number, to: number): Promise<T[]> {
    const url = this.createUrl(path, from, to);

    try {
      return await this.fetchFromUrl<T[]>(url);
    } catch (error) {
      logException(logger, error);

      return [];
    }
  }

  createUrl(path: ApiPath, from: number, to: number): string {
    return `${this._baseUrl}${path}?from=${from}&to=${to}`;
  }

  createTemplate(): string {
    return `${this._baseUrl}{path}?from={date}&to={date}`;
  }

  async getCurrentVersion(): Promise<number> {
    const response: EndpointResponse = await this.fetchFromUrl(this._baseUrl);

    return response.toRv;
  }
}
