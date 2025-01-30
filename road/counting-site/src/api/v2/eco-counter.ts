import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { ApiData, ApiSite } from "../../model/v2/api-model.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";
import { TZDate } from "@date-fns/tz";

export const URL_ALL_SITES = "/api/v2/sites?include=domain";
export const URL_SITE_DATA = "/api/v2/history/traffic/raw";

export class EcoCounterApi {
  readonly _apiKey: string;
  readonly _endpointUrl: string;

  constructor(endpointUrl: string, apiKey: string) {
    this._endpointUrl = endpointUrl;
    this._apiKey = apiKey;
  }

  async getFromServer<T>(url: string): Promise<T> {
    const start = Date.now();
    const serverUrl = `${this._endpointUrl}${url}`;

    logger.info({
      method: "EcoCounterApi.getFromServer",
      message: "sending to url " + serverUrl,
    });

    try {
      const resp = await ky.get(serverUrl, {
        headers: {
          accept: MediaType.APPLICATION_JSON,
          "Accept-Encoding": "gzip, deflate, br",
          "X-API-KEY": this._apiKey,
        },
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
    } finally {
      logger.info({
        method: "EcoCounterApi.getFromServer",
        tookMs: Date.now() - start,
      });
    }
  }

  getSites(): Promise<ApiSite[]> {
    return this.getFromServer(URL_ALL_SITES);
  }

  getDataForSite(siteId: number, from: Date, to: Date): Promise<ApiData[]> {
    // must use Helsinki time with the integration source
    const tzFrom = new TZDate(from).withTimeZone("Europe/Helsinki");
    const tzTo = new TZDate(to).withTimeZone("Europe/Helsinki");

    // formats dates to YYYY-MM-DD
    const fromString = tzFrom.toLocaleDateString("en-CA");
    const toString = tzTo.toLocaleDateString("en-CA");

    // format times and get HH:MM
    const fromTime = tzFrom.toLocaleTimeString("en-GB").substring(0, 5);
    const toTime = tzTo.toLocaleTimeString("en-GB").substring(0, 5);

    return this.getFromServer(
      `${URL_SITE_DATA}?siteId=${siteId}&startDate=${fromString}&endDate=${toString}&startTime=${fromTime}&endTime=${toTime}`,
    );
  }
}
