import {WebSocket} from "ws";

type AwakeAiATXMessage = {
    msgType: AwakeAiATXEventType
}

export enum AwakeAiATXEventType {
    SUBSCRIPTION_STATUS = 'subscription-status',
    EVENT = 'event'
}

export enum AwakeATXZoneEventType {
    ARRIVAL = 'arrival',
    DEPARTURE = 'departure'
}

export type AwakeAISubscriptionMessage = AwakeAiATXMessage & {
    /**
     * Subscription id, equivalent to session id
     */
    readonly subscriptionId: string
}

export enum AwakeAiATXZoneType {
    VTS_AREA = 'vts',
    PILOT_BOARDING_AREA = 'pbp',
    PORT_AREA = 'portarea',
    BERTH = 'berth',
    ANCHORAGE = 'anchorage'
}

export type AwakeAIATXTimestampMessage = AwakeAiATXMessage & {
    /**
     * Possible value 'zone-event'
     */
    readonly eventType: string

    /**
     * UTC string
     */
    readonly eventTimestamp: string

    /**
     * UUID
     */
    readonly eventId: string

    /**
     * Ship MMSI
     */
    readonly mmsi: number

    /**
     * Ship IMO
     */
    readonly imo: number

    /**
     * Ship name
     */
    readonly shipName: string

    /**
     * Ship coordinates
     */
    readonly location: [number, number]

    /**
     * UUID
     */
    readonly zoneId: string

    /**
     * Type of zone for arrival/departure
     */
    readonly zoneType: AwakeAiATXZoneType

    /**
     * Event type: arrival or departure
     */
    readonly zoneEventType: AwakeATXZoneEventType

    /**
     * Zone name
     */
    readonly zoneName: string

    /**
     * Array of LOCODEs
     */
    readonly locodes: string[]
}

export const SUBSCRIPTION_MESSAGE = {
    msgType: 'subscribe',
    parameters: [{
        eventType: 'zone-event',
        countries: ['FI']
    }]
};

export class AwakeAiATXApi {

    private readonly url: string
    private readonly apiKey: string
    private readonly WebSocketClass: new (url: string) => WebSocket
    private subscriptionId: string

    constructor(url: string, apiKey: string, WebSocketClass: new (url: string) => WebSocket) {
        this.url = url;
        this.apiKey = apiKey;
        this.WebSocketClass = WebSocketClass;
    }

    async getATXs(timeoutMillis: number): Promise<AwakeAIATXTimestampMessage[]> {
        const webSocket = new this.WebSocketClass(this.url + this.apiKey);

        webSocket.on('open', () => {
            const startMessage = this.subscriptionId ? AwakeAiATXApi.createResumeMessage(this.subscriptionId) : SUBSCRIPTION_MESSAGE;
            webSocket.send(JSON.stringify(startMessage));
        });

        const atxs: AwakeAIATXTimestampMessage[] = [];

        webSocket.on('message', (messageRaw: string) => {
            const message: AwakeAiATXMessage = JSON.parse(messageRaw);
            if (message.msgType === AwakeAiATXEventType.SUBSCRIPTION_STATUS) {
                this.subscriptionId = (message as AwakeAISubscriptionMessage).subscriptionId;
            } else if (message.msgType === AwakeAiATXEventType.EVENT) {
                atxs.push(message as AwakeAIATXTimestampMessage);
            } else {
                console.warn('method=getATXs Unknown message received %s', JSON.stringify(message));
            }
        });

        return new Promise((resolve, reject) => {
            webSocket.on('error', (error) => {
                console.error('method=getATXs error', error);
                reject('Error');
            });
            setTimeout(() => {
                webSocket.close();
                resolve(atxs);
            }, timeoutMillis);
        });
    }

    static createResumeMessage(subscriptionId: string) {
        console.info('method=createResumeMessage Existing session found')
        return {
            msgType: 'subscribe',
            resume: subscriptionId
        };
    }
}