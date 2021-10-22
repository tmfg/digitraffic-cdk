const WebSocket = require('ws');

type AwakeAiATXMessage = {
    msgType: AwakeAiATXEventType
}

enum AwakeAiATXEventType {
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

export type AwakeAIATXMessage = AwakeAiATXMessage & {
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
     * Possible value 'pbp'
     */
    readonly zoneType: string

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

const SUBSCRIPTION_MESSAGE = {
    msgType: 'subscribe',
    parameters: [{
        eventType: 'zone-event',
        countries: ['FI']
    }]
};

export class AwakeAiATXApi {

    private readonly url: string
    private readonly apiKey: string
    private subscriptionId: string

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    async getATXs(timeoutMillis: number): Promise<AwakeAIATXMessage[]> {
        const webSocket = new WebSocket(this.url + this.apiKey);

        webSocket.on('open', () => {
            const startMessage = this.subscriptionId ? this.createResumeMessage() : SUBSCRIPTION_MESSAGE;
            webSocket.send(JSON.stringify(startMessage));
        });

        const atxs: AwakeAIATXMessage[] = [];

        webSocket.on('message', (messageRaw: string) => {
            const message: AwakeAiATXMessage = JSON.parse(messageRaw);
            if (message.msgType === AwakeAiATXEventType.SUBSCRIPTION_STATUS) {
                this.subscriptionId = (message as AwakeAISubscriptionMessage).subscriptionId;
            } else if (message.msgType === AwakeAiATXEventType.EVENT) {
                atxs.push(message as AwakeAIATXMessage);
            } else {
                console.warn('method=getATXs Unknown message received %s', JSON.stringify(message));
            }
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                webSocket.close();
                resolve(atxs);
            }, timeoutMillis);
        });
    }

    private createResumeMessage() {
        console.info('method=createResumeMessage Existing session found')
        return {
            msgType: 'subscribe',
            resume: this.subscriptionId
        };
    }
}
