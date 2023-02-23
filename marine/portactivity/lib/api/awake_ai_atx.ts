import { WebSocket } from "ws";
import { AwakeAiZoneType } from "./awake_common";
import { AWSError, SSM } from "aws-sdk";
import { PortActivityParameterKeys } from "../keys";
import * as URL from "url";

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
    readonly locodes: string[];
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

const isAWSError = (error: unknown): error is AWSError => {
    if (typeof error !== "object") return false;
    if (error && "code" in error && "message" in error) return true;
    return false;
};

export class AwakeAiATXApi {
    private readonly url: string;
    private readonly apiKey: string;
    private readonly webSocketClass: new (url: string | URL) => WebSocket;
    private readonly ssm: SSM;

    constructor(
        url: string,
        apiKey: string,
        webSocketClass: new (url: string | URL) => WebSocket,
        ssm: SSM
    ) {
        this.url = url;
        this.apiKey = apiKey;
        this.webSocketClass = webSocketClass;
        this.ssm = ssm;
    }

    async getATXs(
        timeoutMillis: number
    ): Promise<AwakeAIATXTimestampMessage[]> {
        const ssmParams = {
            Name: PortActivityParameterKeys.AWAKE_ATX_SUBSCRIPTION_ID,
        };

        let subscriptionId: string | undefined;

        try {
            const parameter = await this.ssm.getParameter(ssmParams).promise();
            subscriptionId = parameter.Parameter?.Value;
        } catch (error: unknown | AWSError) {
            console.error(
                `method=getATXs ${
                    isAWSError(error) ? error.code : "Error"
                } fetching from Parameter Store`
            );
        }

        const webSocket = new this.webSocketClass(this.url + this.apiKey);
        webSocket.on("open", () => {
            const startMessage = subscriptionId
                ? AwakeAiATXApi.createResumeMessage(subscriptionId)
                : SUBSCRIPTION_MESSAGE;
            webSocket.send(JSON.stringify(startMessage));
        });

        const atxs: AwakeAIATXTimestampMessage[] = [];

        webSocket.on("message", (messageRaw: string) => {
            const message = JSON.parse(
                messageRaw
            ) as unknown as AwakeAiATXMessage;

            switch (message.msgType) {
                case AwakeAiATXEventType.SUBSCRIPTION_STATUS: {
                    const receivedSubscriptionId = (
                        message as AwakeAISubscriptionMessage
                    ).subscriptionId;

                    if (receivedSubscriptionId !== subscriptionId) {
                        console.info(
                            `method=getATXs Updating subscriptionId to ${receivedSubscriptionId}`
                        );
                        this.ssm
                            .putParameter({
                                ...ssmParams,
                                Overwrite: true,
                                Type: "String",
                                Value: receivedSubscriptionId,
                            })
                            .promise()
                            .catch((e) =>
                                console.error(
                                    `method=getATXs ${
                                        isAWSError(e)
                                            ? e.message
                                            : "Error updating Parameter Store"
                                    }`
                                )
                            );
                    }

                    break;
                }
                case AwakeAiATXEventType.EVENT:
                    atxs.push(message as AwakeAIATXTimestampMessage);
                    break;
                default:
                    console.warn(
                        "method=getATXs Unknown message received %s",
                        JSON.stringify(message)
                    );
            }
        });

        return new Promise((resolve, reject) => {
            webSocket.on("error", (error) => {
                console.error("method=getATXs error", error);
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
        console.info("method=createResumeMessage Existing session found");
        return {
            msgType: "subscribe",
            resume: subscriptionId,
        };
    }
}
