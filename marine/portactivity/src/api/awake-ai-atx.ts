import type { PutParameterResult } from "@aws-sdk/client-ssm";
import {
  GetParameterCommand,
  PutParameterCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import type { WebSocket } from "ws";
import { PortActivityParameterKeys } from "../keys.js";
import type { Ports } from "../service/portareas.js";
import type { AwakeAiZoneType } from "./awake-common.js";

import { OAuthTokenApi } from "./oauth-token-api.js";

interface AwakeAiATXMessage {
  msgType: AwakeAiATXEventType;
}

export enum AwakeAiATXEventType {
  SUBSCRIPTION_STATUS = "subscription-status",
  EVENT = "event",
}

export enum AwakeATXZoneEventType {
  ARRIVAL = "arrival",
  DEPARTURE = "departure",
}

export interface AwakeAISubscriptionMessage extends AwakeAiATXMessage {
  /**
   * Subscription id, equivalent to session id
   */
  readonly subscriptionId?: string;

  /**
   * Status of the subscription (e.g. "active", "failed")
   */
  readonly status?: string;

  /**
   * Error message when status is "failed"
   */
  readonly message?: string;
}

export interface AwakeAIATXTimestampMessage extends AwakeAiATXMessage {
  /**
   * Possible value 'zone-event'
   */
  readonly eventType: string;

  /**
   * UTC string
   */
  readonly eventTimestamp: string;

  /**
   * UUID
   */
  readonly eventId: string;

  /**
   * Ship MMSI
   */
  readonly mmsi: number;

  /**
   * Ship IMO
   */
  readonly imo: number;

  /**
   * Ship name
   */
  readonly shipName: string;

  /**
   * Ship coordinates
   */
  readonly location: [number, number];

  /**
   * UUID
   */
  readonly zoneId: string;

  /**
   * Type of zone for arrival/departure
   */
  readonly zoneType: AwakeAiZoneType;

  /**
   * Event type: arrival or departure
   */
  readonly zoneEventType: AwakeATXZoneEventType;

  /**
   * Zone name
   */
  readonly zoneName: string;

  /**
   * Array of LOCODEs
   */
  readonly locodes: Ports;
}

export const SUBSCRIPTION_MESSAGE = {
  msgType: "subscribe",
  parameters: [
    {
      eventType: "zone-event",
      countries: ["FI"],
    },
  ],
};

const ssm = new SSMClient({});

export class AwakeAiATXApi {
  private readonly url: string;
  private readonly oAuthTokenApi: OAuthTokenApi;
  private readonly webSocketClass: new (
    url: string | URL,
    options?: object,
  ) => WebSocket;

  constructor(
    url: string,
    oAuthTokenEndpoint: string,
    oAuthClientId: string,
    oAuthClientSecret: string,
    webSocketClass: new (url: string | URL, options?: object) => WebSocket,
  ) {
    this.url = url;
    this.oAuthTokenApi = new OAuthTokenApi({
      oAuthTokenEndpoint,
      oAuthClientId,
      oAuthClientSecret,
    });
    this.webSocketClass = webSocketClass;
  }

  async getATXs(timeoutMillis: number): Promise<AwakeAIATXTimestampMessage[]> {
    const subscriptionId = await this.getFromParameterStore(
      ssm,
      PortActivityParameterKeys.AWAKE_ATX_SUBSCRIPTION_ID,
    );

    const oAuthToken = await this.oAuthTokenApi.getOAuthToken();

    const webSocket = new this.webSocketClass(this.url, {
      headers: { Authorization: `Bearer ${oAuthToken.access_token}` },
    });

    webSocket.on("open", () => {
      const startMessage = subscriptionId
        ? AwakeAiATXApi.createResumeMessage(subscriptionId)
        : SUBSCRIPTION_MESSAGE;
      webSocket.send(JSON.stringify(startMessage));
    });

    const atxs: AwakeAIATXTimestampMessage[] = [];

    webSocket.on("message", (messageRaw: string) => {
      const message = JSON.parse(messageRaw) as unknown as AwakeAiATXMessage;

      switch (message.msgType) {
        case AwakeAiATXEventType.SUBSCRIPTION_STATUS: {
          logger.debug({
            method: "AwakeAiATXApi.getATXs",
            message: `Received subscription-status: ${messageRaw}`,
          });
          const subscriptionMessage = message as AwakeAISubscriptionMessage;
          if (subscriptionMessage.status === "failed") {
            logger.warn({
              method: "AwakeAiATXApi.getATXs",
              message: `Subscription resume failed: ${subscriptionMessage.message ?? "unknown reason"}, starting fresh subscription`,
            });
            webSocket.send(JSON.stringify(SUBSCRIPTION_MESSAGE));
            break;
          }
          const receivedSubscriptionId = subscriptionMessage.subscriptionId;
          if (
            receivedSubscriptionId &&
            receivedSubscriptionId !== subscriptionId
          ) {
            this.putInParameterStore(
              ssm,
              PortActivityParameterKeys.AWAKE_ATX_SUBSCRIPTION_ID,
              receivedSubscriptionId,
            )
              .then(() =>
                logger.info({
                  method: "AwakeAiATXApi.getATXs",
                  message: `Updated subscriptionId to ${receivedSubscriptionId}`,
                }),
              )
              .catch((error) => logException(logger, error));
          }
          break;
        }
        case AwakeAiATXEventType.EVENT: {
          const atxEvent = message as AwakeAIATXTimestampMessage;
          logger.debug({
            method: "AwakeAiATXApi.getATXs",
            message: `Received event: mmsi=${atxEvent.mmsi} imo=${atxEvent.imo} zone=${atxEvent.zoneName} zoneEvent=${atxEvent.zoneEventType} eventId=${atxEvent.eventId}`,
          });
          atxs.push(atxEvent);
          break;
        }
        default:
          logger.warn({
            method: "AwakeAiATXApi.getATXs",
            message: `Unknown message received ${JSON.stringify(message)}`,
          });
      }
    });

    return new Promise((resolve, reject) => {
      webSocket.on("error", (error) => {
        logException(logger, error);
        reject("Error");
      });
      setTimeout(() => {
        webSocket.close();
        resolve(atxs);
      }, timeoutMillis);
    });
  }

  static createResumeMessage(subscriptionId: string): {
    msgType: string;
    resume: string;
  } {
    logger.info({
      method: "AwakeAiATXApi.getATXs",
      message: `Existing session found`,
    });
    return {
      msgType: "subscribe",
      resume: subscriptionId,
    };
  }

  async getFromParameterStore(
    ssm: SSMClient,
    parameterName: string,
  ): Promise<string | undefined> {
    try {
      const command = new GetParameterCommand({ Name: parameterName });
      const response = await ssm.send(command);
      return Promise.resolve(response.Parameter?.Value);
    } catch (error: unknown) {
      logException(logger, error);
      return Promise.reject();
    }
  }

  async putInParameterStore(
    ssm: SSMClient,
    parameterName: string,
    parameterValue: string,
  ): Promise<PutParameterResult> {
    const command = new PutParameterCommand({
      Name: parameterName,
      Overwrite: true,
      Type: "String",
      Value: parameterValue,
    });
    return ssm.send(command);
  }
}
