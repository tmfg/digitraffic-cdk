import { logger } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger-default";
import { createKyHooks } from "@digitraffic/common/dist/aws/runtime/logging/http-interceptors";
import { LoggerFactory } from "@digitraffic/common/dist/aws/runtime/logging/http-logger";
import ky, { HTTPError } from "ky";

export interface AreaLightsBrightenRequest {
  /**
   * Route id (areaId)
   */
  readonly routeId: number;

  /**
   * Visibility in metres
   */

  readonly visibility: number | null;

  /**
   * Time to set the brightness on in minutes
   */
  readonly time: number;

  /**
   * MMSI of ship triggering brighten request
   */
  readonly MMSI: string;

  /**
   * Name of ship triggering brighten request
   */
  readonly shipName: string;
}

export interface AreaLightsBrightenResponse {
  /**
   * ATON numbers for successful lights set commands
   */
  readonly LightsSetSentSuccessfully: number[];

  /**
   * ATON numbers for failed lights set commands
   */
  readonly LightsSetSentFailed: number[];
}

export class AreaLightsApi {
  private readonly url: string;
  private readonly apiKey: string;

  private readonly _loggerFactory: LoggerFactory;

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
    this._loggerFactory = new LoggerFactory({
      context: "Shiplight",
      urlTemplate: url,
    });
  }

  updateLightsForArea(
    request: AreaLightsBrightenRequest,
  ): Promise<AreaLightsBrightenResponse> {
    const httpLogger = this._loggerFactory.logger(this.url);

    const requestPromise = ky.post(this.url, {
      body: JSON.stringify(request),
      headers: { "x-api-key": this.apiKey },
      hooks: createKyHooks(httpLogger),
      //            validateStatus: (status) => status === 200
    });

    return requestPromise
      .then((response) => {
        return response.json<AreaLightsBrightenResponse>();
      })
      .catch((error) => {
        if (error instanceof HTTPError) {
          if (error.response) {
            logger.error({
              method: "AreaLightsApi.updateLightsForArea",
              message: "failed",
              customStatus: error.response.status,
            });

            return Promise.reject(
              `API returned status ${error.response.status}`,
            );
          } else if (error.request) {
            logger.error({
              method: "AreaLightsApi.updateLightsForArea",
              message: "error with request",
              customDetails: JSON.stringify(error.request),
            });
            return Promise.reject("Error with request");
          }
        }

        return Promise.reject("Unknown error");
      });
  }
}
