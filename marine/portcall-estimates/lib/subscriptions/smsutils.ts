import {EstimateSubscription, SnsSubscriptionEvent} from './model/subscription';

const SUBSCRIBE_OPERATION = 'tilaa';

// correct syntax: TILAA FINLI 23:30
export function parseSnsSubscriptionEvent(event: SnsSubscriptionEvent): EstimateSubscription | null {
    const parts = event.messageBody.split(' ');

    if (parts.length < 3) {
        console.error(`Invalid message ${event.messageBody}`);
        return null;
    }

    const operation = parts[0].toLowerCase();
    if (operation != SUBSCRIBE_OPERATION) {
        console.warn(`Unknown operation ${operation}, event ${event.messageBody}`);
        return null;
    }

    return {
        phoneNumber: event.originationNumber,
        locode: parts[1].toLowerCase(),
        time: parts[2]
    };
}

export function createShiplistSms(): string {
    return 'test';
}