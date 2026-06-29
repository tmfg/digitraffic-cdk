import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { isBefore, parseISO } from "date-fns";
import type { AwakeAiPortApi } from "../api/awake-ai-port.js";
import { AwakeAiZoneType } from "../api/awake-common.js";
import type { OAuthTokenApi } from "../api/oauth-token-api.js";
import { EventSource } from "../model/eventsource.js";
import type { ApiTimestamp } from "../model/timestamp.js";
import {
  etdPredictionToTimestamp,
  isAwakeEtdPrediction,
  isDigitrafficEtdPrediction,
  voyageUnderwayOrNotStarted,
} from "./awake-ai-etx-helper.js";

export class AwakeAiETDPortService {
  private readonly api: AwakeAiPortApi;
  private readonly oAuthTokenApi: OAuthTokenApi;

  constructor(api: AwakeAiPortApi, oAuthTokenApi: OAuthTokenApi) {
    this.api = api;
    this.oAuthTokenApi = oAuthTokenApi;
  }

  private departureTimeInThePast(date: string): boolean {
    return isBefore(parseISO(date), Date.now());
  }

  async getAwakeAiTimestamps(locode: string): Promise<ApiTimestamp[]> {
    const oAuthToken = await this.oAuthTokenApi.getOAuthToken();
    const resp = await this.api.getETDs(oAuthToken.access_token, locode);

    logger.info({
      method: "AwakeAiETDPortService.getAwakeAiTimestamps",
      message: `Received ETD response: ${JSON.stringify(resp)}`,
    });

    if (!resp.schedule) {
      logger.warn({
        method: "AwakeAiETDPortService.getAwakeAiTimestamps",
        message: `no ETD received, state=${resp.type}`,
      });
      return [];
    }

    return (
      resp.schedule
        // filter out stopped voyages
        .filter(voyageUnderwayOrNotStarted)
        .flatMap((schedule) => {
          const etdPredictions = schedule.voyage.predictions
            .filter(isAwakeEtdPrediction)
            .filter((etdPrediction) => {
              if (this.departureTimeInThePast(etdPrediction.departureTime)) {
                logger.warn({
                  method: "AwakeAiETDPortService.getAwakeAiTimestamps",
                  message: `ETD prediction event time in the past, IMO: ${schedule.ship.imo}, MMSI: ${schedule.ship.mmsi}, prediction: ${JSON.stringify(
                    etdPrediction,
                  )}`,
                });
                return false;
              }
              return true;
            })
            // filter out predictions originating from digitraffic portcall api
            .filter((etdPrediction) => {
              if (isDigitrafficEtdPrediction(etdPrediction)) {
                logger.warn({
                  method: "AwakeAiETDPortService.getAwakeAiTimestamps",
                  message: `received Digitraffic ETD prediction, IMO: ${schedule.ship.imo}, MMSI: ${schedule.ship.mmsi}, prediction: ${JSON.stringify(
                    etdPrediction,
                  )}`,
                });
                return false;
              }
              return true;
            })
            .filter(
              (etdPrediction) =>
                etdPrediction.zoneType === AwakeAiZoneType.BERTH,
            );

          return etdPredictions.map((etdPrediction) => {
            return etdPredictionToTimestamp(
              etdPrediction,
              EventSource.AWAKE_AI_PRED,
              locode,
              schedule.ship.mmsi,
              schedule.ship.imo,
              undefined,
              undefined,
            );
          });
        })
        .filter((ts): ts is ApiTimestamp => !!ts)
    );
  }
}
