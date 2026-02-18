import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import ky, { HTTPError } from "ky";
import type { AwakeAiPredictedVoyage, AwakeAiShip } from "./awake-common.js";
import { AwakeAiPredictionType } from "./awake-common.js";

export enum AwakeAiPortResponseType {
  OK = "OK",
  PORT_NOT_FOUND = "PORT_NOT_FOUND",
  INVALID_LOCODE = "INVALID_LOCODE",
  SERVER_ERROR = "SERVER_ERROR",
  NO_RESPONSE = "NO_RESPONSE",
  UNKNOWN = "UNKNOWN",
}

export enum AwakeAiPortResource {
  ARRIVALS = "arrivals",
  DEPARTURES = "departures",
}

export interface AwakeAiPortSchedule {
  readonly ship: AwakeAiShip;
  readonly voyage: AwakeAiPredictedVoyage;
}

export interface AwakeAiPortResponse {
  readonly type: AwakeAiPortResponseType;
  readonly schedule?: AwakeAiPortSchedule[];
}

export class AwakeAiPortApi {
  private readonly url: string;
  private readonly apiKey: string;

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  /**
   * Queries the Awake.AI Voyages API for predictions
   * @param resource Resource/endpoint in the Voyages port API.
   * @param locode Destination LOCODE. If set, overrides destination prediction.
   * @param maxSequenceNo Maximum number of preceding stops in multi-hop predictions.
   */
  async getPredictions(
    resource: AwakeAiPortResource,
    locode: string,
    predictionType: AwakeAiPredictionType,
    maxSequenceNo: number = 1,
  ): Promise<AwakeAiPortResponse> {
    const start = Date.now();
    try {
      const url = `${this.url}/port/${locode}/${resource}?maxSequenceNo=${maxSequenceNo}&predictionType=${predictionType}&predictionType=${AwakeAiPredictionType.ARRIVAL_PORT_CALL}&predictionMetadata=true`;

      logger.info({
        method: "AwakeAiPortApi.getPredictions",
        message: `calling URL ${url}`,
      });
      const response = await ky
        .get(url, {
          headers: {
            Authorization: this.apiKey,
            Accept: MediaType.APPLICATION_JSON,
          },
          retry: 0,
        })
        .json();
      return {
        type: AwakeAiPortResponseType.OK,
        schedule: response as AwakeAiPortSchedule[],
      };
    } catch (error) {
      if (error instanceof HTTPError) {
        return AwakeAiPortApi.handleError(error);
      }
      throw error;
    } finally {
      logger.info({
        method: "AwakeAiPortApi.getPredictions",
        tookMs: Date.now() - start,
      });
    }
  }

  async getETAs(
    locode: string,
    maxSequenceNo: number = 1,
  ): Promise<AwakeAiPortResponse> {
    return this.getPredictions(
      AwakeAiPortResource.ARRIVALS,
      locode,
      AwakeAiPredictionType.ETA,
      maxSequenceNo,
    );
  }

  async getETDs(
    locode: string,
    maxSequenceNo: number = 1,
  ): Promise<AwakeAiPortResponse> {
    return this.getPredictions(
      AwakeAiPortResource.DEPARTURES,
      locode,
      AwakeAiPredictionType.ETD,
      maxSequenceNo,
    );
  }

  static handleError(error: HTTPError): AwakeAiPortResponse {
    if (!error.response) {
      return {
        type: AwakeAiPortResponseType.NO_RESPONSE,
      };
    }
    switch (error.response.status) {
      case 404:
        return {
          type: AwakeAiPortResponseType.PORT_NOT_FOUND,
        };
      case 422:
        return {
          type: AwakeAiPortResponseType.INVALID_LOCODE,
        };
      case 500:
        return {
          type: AwakeAiPortResponseType.SERVER_ERROR,
        };
      default:
        return {
          type: AwakeAiPortResponseType.UNKNOWN,
        };
    }
  }
}
