import { createKyHooks } from "@digitraffic/common/dist/aws/runtime/logging/http-interceptors";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import ky, { HTTPError } from "ky";
import { loggerFactory } from "../logging.js";
import type { AwakeAiPredictedVoyage, AwakeAiShip } from "./awake-common.js";

export enum AwakeAiShipResponseType {
  OK = "OK",
  SHIP_NOT_FOUND = "SHIP_NOT_FOUND",
  INVALID_SHIP_ID = "INVALID_SHIP_ID",
  SERVER_ERROR = "SERVER_ERROR",
  NO_RESPONSE = "NO_RESPONSE",
  UNKNOWN = "UNKNOWN",
}

export interface AwakeAiShipApiResponse {
  readonly type: AwakeAiShipResponseType;
  readonly schedule?: AwakeAiShipVoyageSchedule;
}

export enum AwakeAiShipPredictability {
  PREDICTABLE = "predictable",
  NOT_PREDICTABLE = "not-predictable",
  SHIP_DATA_NOT_UPDATED = "ship-data-not-updated",
}

export interface AwakeAiShipVoyageSchedule {
  readonly ship: AwakeAiShip;
  readonly predictability: AwakeAiShipPredictability;
  readonly predictedVoyages: AwakeAiPredictedVoyage[];
}

export class AwakeAiETAShipApi {
  private readonly _url: string;

  constructor(url: string) {
    this._url = url;
  }

  /**
   * Queries the Awake.AI ship ETA API for predictions
   * @param imo Ship IMO
   * @param locode Destination LOCODE. If set, overrides destination prediction.
   */
  async getETA(
    accessToken: string,
    imo: number,
    locode?: string,
  ): Promise<AwakeAiShipApiResponse> {
    try {
      let url = `${this._url}/ship/${imo}?predictionMetadata=true`;
      const httpLogger = loggerFactory.logger(
        url,
        `${this._url}/ship/{number}`,
      );

      if (locode) {
        url += `&destination=${locode}`;
      }

      const response = await ky
        .get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: MediaType.APPLICATION_JSON,
          },
          hooks: createKyHooks(httpLogger),
          retry: 0,
        })
        .json();
      return {
        type: AwakeAiShipResponseType.OK,
        schedule: response as AwakeAiShipVoyageSchedule,
      };
    } catch (error) {
      if (error instanceof HTTPError) {
        return AwakeAiETAShipApi.handleError(error);
      }
      throw error;
    }
  }

  static handleError(error: HTTPError): AwakeAiShipApiResponse {
    if (!error.response) {
      return {
        type: AwakeAiShipResponseType.NO_RESPONSE,
      };
    }
    switch (error.response.status) {
      case 404:
        return {
          type: AwakeAiShipResponseType.SHIP_NOT_FOUND,
        };
      case 422:
        return {
          type: AwakeAiShipResponseType.INVALID_SHIP_ID,
        };
      case 500:
        return {
          type: AwakeAiShipResponseType.SERVER_ERROR,
        };
      default:
        return {
          type: AwakeAiShipResponseType.UNKNOWN,
        };
    }
  }
}
