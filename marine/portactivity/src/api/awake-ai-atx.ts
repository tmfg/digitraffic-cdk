import type { WebSocket } from "ws";
import type { AwakeAiZoneType } from "./awake-common.js";
import { SSM } from "aws-sdk";
import { PortActivityParameterKeys } from "../keys.js";
// TODO: v3
import type { PutParameterResult } from "aws-sdk/clients/ssm.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import type { Ports } from "../service/portareas.js";

interface AwakeAiATXMessage {
    msgType: AwakeAiATXEventType;
}

export enum AwakeAiATXEventType {
    SUBSCRIPTION_STATUS = "subscription-status",
    EVENT = "event"
}

export enum AwakeATXZoneEventType {
    ARRIVAL = "arrival",
    DEPARTURE = "departure"
}

export interface AwakeAISubscriptionMessage extends AwakeAiATXMessage {
    /**
     * Subscription id, equivalent to session id
     */
    readonly subscriptionId: string;
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
            countries: ["FI"]
        }
    ]
};

export const getFromParameterStore = async (name: string): Promise<string | undefined> => {
    const ssmParams = {
        Name: name
    };
    try {
        const parameter = await new SSM().getParameter(ssmParams).promise();
        return Promise.resolve(parameter.Parameter?.Value);
    } catch (error: unknown) {
        logException(logger, error);
        return Promise.reject();
    }
};

export const putInParameterStore = (name: string, value: string): Promise<PutParameterResult> => {
    const ssmParams = {
        Name: name,
        Overwrite: true,
        Type: "String",
        Value: value
    };
    return new SSM().putParameter(ssmParams).promise();
};

export class AwakeAiATXApi {
    private readonly url: string;
    private readonly apiKey: string;
    private readonly webSocketClass: new (url: string | URL) => WebSocket;

    constructor(url: string, apiKey: string, webSocketClass: new (url: string | URL) => WebSocket) {
        this.url = url;
        this.apiKey = apiKey;
        this.webSocketClass = webSocketClass;
    }

    async getATXs(timeoutMillis: number): Promise<AwakeAIATXTimestampMessage[]> {
        const subscriptionId = await getFromParameterStore(
            PortActivityParameterKeys.AWAKE_ATX_SUBSCRIPTION_ID
        );

        const webSocket = new this.webSocketClass(this.url + this.apiKey);
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
                    const receivedSubscriptionId = (message as AwakeAISubscriptionMessage).subscriptionId;
                    if (receivedSubscriptionId !== subscriptionId) {
                        putInParameterStore(
                            PortActivityParameterKeys.AWAKE_ATX_SUBSCRIPTION_ID,
                            receivedSubscriptionId
                        )
                            .then(() =>
                                logger.info({
                                    method: "AwakeAiATXApi.getATXs",
                                    message: `Updated subscriptionId to ${receivedSubscriptionId}`
                                })
                            )
                            .catch((error) => logException(logger, error));
                    }
                    break;
                }
                case AwakeAiATXEventType.EVENT:
                    atxs.push(message as AwakeAIATXTimestampMessage);
                    break;
                default:
                    logger.warn({
                        method: "AwakeAiATXApi.getATXs",
                        message: `Unknown message received ${JSON.stringify(message)}`
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
            message: `Existing session found`
        });
        return {
            msgType: "subscribe",
            resume: subscriptionId
        };
    }
}
