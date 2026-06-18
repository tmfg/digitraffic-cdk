import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import ky, { HTTPError } from "ky";
import type { AwakeAiPredictedVoyage, AwakeAiShip } from "./awake-common.js";

import { OAuthTokenApi } from "./oauth-token-api.js";

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
  private readonly url: string;
  private readonly apiKey: string;
  private readonly oauthClientId: string;
  private readonly oauthClientSecret: string;

  constructor(
    url: string,
    apiKey: string,
    oauthClientId: string,
    oauthClientSecret: string,
  ) {
    this.url = url;
    this.apiKey = apiKey;
    this.oauthClientId = oauthClientId;
    this.oauthClientSecret = oauthClientSecret;
  }

  /**
   * Queries the Awake.AI ship ETA API for predictions
   * @param imo Ship IMO
   * @param locode Destination LOCODE. If set, overrides destination prediction.
   */
  async getETA(imo: number, locode?: string): Promise<AwakeAiShipApiResponse> {
    const start = Date.now();
    try {
      let url = `${this.url}/ship/${imo}?predictionMetadata=true`;
      if (locode) {
        url += `&destination=${locode}`;
      }
      logger.info({
        method: "AwakeAiETAShipApi.getETA",
        message: `calling URL ${url}`,
      });

      const oAuthTokenApi = new OAuthTokenApi({
        oAuthTokenEndpoint:
          "https://auth.dev.awake.ai/realms/awake/protocol/openid-connect/token",
        oAuthClientId: this.oauthClientId,
        oAuthClientSecret: this.oauthClientSecret,
      });

      const oAuthToken = await oAuthTokenApi.getOAuthToken();

      const response = await ky
        .get(url, {
          headers: {
            Authorization: `Bearer ${oAuthToken.access_token}`,
            Accept: MediaType.APPLICATION_JSON,
          },
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
    } finally {
      logger.info({
        method: "AwakeAiETAShipApi.getETA",
        tookMs: Date.now() - start,
      });
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
