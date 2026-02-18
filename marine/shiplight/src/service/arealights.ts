import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { RetryLogError, retry } from "@digitraffic/common/dist/utils/retry";
import type { AreaLightsApi } from "../api/arealights.js";
import type { AreaTraffic } from "../model/areatraffic.js";

export class AreaLightsService {
  private readonly api: AreaLightsApi;

  constructor(api: AreaLightsApi) {
    this.api = api;
  }

  /**
   * Updates visibility for lights in an area.
   * @param areaTraffic
   */
  async updateLightsForArea(areaTraffic: AreaTraffic): Promise<void> {
    const areaId = areaTraffic.areaId;

    logger.info({
      method: "ArealightsService.updateLightsForArea",
      customDuration: areaTraffic.durationInMinutes,
      customVisibility: areaTraffic.visibilityInMeters?.toString(),
      customMmsi: areaTraffic.ship.mmsi,
    });

    await retry(
      async () => {
        try {
          const response = await this.api.updateLightsForArea({
            routeId: areaId,
            visibility: areaTraffic.visibilityInMeters ?? null,
            time: areaTraffic.durationInMinutes,
            MMSI: areaTraffic.ship.mmsi.toString(),
            shipName: areaTraffic.ship.name,
          });
          if (response.LightsSetSentFailed.length) {
            logger.warn({
              method: "ArealightsService.updateLightsForArea",
              message: `LightsSetSentFailed : ${response.LightsSetSentFailed.join(
                ", ",
              )}`,
            });
          }
        } catch (error) {
          logger.debug({
            method: "ArealightsService.updateLightsForArea",
            message: `DEBUG_ERROR ${JSON.stringify(error)}`,
          });
          throw error;
        }
      },
      2,
      RetryLogError.LOG_LAST_RETRY_AS_ERROR_OTHERS_AS_WARNS,
    );
  }
}
