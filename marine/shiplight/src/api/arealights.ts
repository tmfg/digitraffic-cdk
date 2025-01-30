import ky, { HTTPError } from "ky";

import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

export interface AreaLightsBrightenRequest {
  /**
   * Route id (areaId)
   */
  readonly routeId: number;

  /**
   * Visibility in metres
   */
  // eslint-disable-next-line @rushstack/no-new-null
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

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  updateLightsForArea(
    request: AreaLightsBrightenRequest,
  ): Promise<AreaLightsBrightenResponse> {
    const start = Date.now();

    const requestPromise = ky.post(this.url, {
      body: JSON.stringify(request),
      headers: { "x-api-key": this.apiKey },
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

        logException(logger, error as Error);

        return Promise.reject("Unknown error");
      })
      .finally(() => {
        logger.info({
          method: "AreaLightsApi.updateLightsForArea",
          tookMs: Date.now() - start,
        });
      });
  }
}
