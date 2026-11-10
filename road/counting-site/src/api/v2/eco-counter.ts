import { TZDate } from "@date-fns/tz";
import { logger } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger-default";
import { createKyHooks } from "@digitraffic/common/dist/aws/runtime/logging/http-interceptors";
import { LoggerFactory } from "@digitraffic/common/dist/aws/runtime/logging/http-logger";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";
import type { ApiData, ApiSite } from "../../model/v2/api-model.js";

export const URL_ALL_SITES = "/api/v2/sites?include=domain";
const URL_ALL_SITES_TEMPLATE = "/api/v2/sites?include={string}";
export const URL_SITE_DATA = "/api/v2/history/traffic/raw";
const URL_SITE_TEMPLATE = `${URL_SITE_DATA}?siteId={number}`;

export class EcoCounterApi {
  readonly _apiKey: string;
  readonly _endpointUrl: string;

  readonly _loggerFactory: LoggerFactory;

  constructor(endpointUrl: string, apiKey: string) {
    this._endpointUrl = endpointUrl;
    this._apiKey = apiKey;
    this._loggerFactory = new LoggerFactory({
      context: "counting_site",
    });
  }

  async getFromServer<T>(url: string, template: string): Promise<T> {
    const serverUrl = `${this._endpointUrl}${url}`;
    const httpLogger = this._loggerFactory.logger(
      url,
      `${this._endpointUrl}${template}`,
    );

    try {
      const resp = await ky.get(serverUrl, {
        timeout: 20000,
        headers: {
          accept: MediaType.APPLICATION_JSON,
          "Accept-Encoding": "gzip, deflate, br",
          "X-API-KEY": this._apiKey,
        },
        hooks: createKyHooks(httpLogger),
      });

      if (resp.status !== 200) {
        logger.error({
          method: "EcoCounterApi.getFromServer",
          customStatus: resp.status,
        });

        return Promise.reject();
      }
      return await resp.json<T>();
    } catch (error) {
      logException(logger, error);

      return Promise.reject();
    }
  }

  getSites(): Promise<ApiSite[]> {
    return this.getFromServer(URL_ALL_SITES, URL_ALL_SITES_TEMPLATE);
  }

  getDataForSite(siteId: number, from: Date, to: Date): Promise<ApiData[]> {
    // must use Helsinki time with the integration source
    const tzFrom = new TZDate(from).withTimeZone("Europe/Helsinki");
    const tzTo = new TZDate(to).withTimeZone("Europe/Helsinki");

    // formats dates to YYYY-MM-DD
    const fromDate = tzFrom.toLocaleDateString("en-CA");
    const toDate = tzTo.toLocaleDateString("en-CA");

    // format times and get HH:MM
    const fromTime = tzFrom.toLocaleTimeString("en-GB").substring(0, 5);
    const toTime = tzTo.toLocaleTimeString("en-GB").substring(0, 5);

    return this.getFromServer(
      `${URL_SITE_DATA}?siteId=${siteId}&startDate=${fromDate}&endDate=${toDate}&startTime=${fromTime}&endTime=${toTime}`,
      URL_SITE_TEMPLATE,
    );
  }
}
