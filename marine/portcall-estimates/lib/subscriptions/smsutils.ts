import {EstimateRemoval, EstimateSubscription, SnsSubscriptionEvent} from './model/subscription';

export enum SubscriptionOperation {
    INVALID, SUBSCRIBE, REMOVE, HELP, LIST
}

export function parseOperation(event: SnsSubscriptionEvent): SubscriptionOperation {
    const operationString = event.messageBody.split(' ')[0].toUpperCase();

    switch (operationString) {
        case 'SUBSCRIBE':
        case 'ORDER':
            return SubscriptionOperation.SUBSCRIBE;
        case 'REMOVE':
            return SubscriptionOperation.REMOVE;
        case 'HELP':
            return SubscriptionOperation.HELP;
        case 'LIST':
            return SubscriptionOperation.LIST;
        default:
            return SubscriptionOperation.INVALID;
    }
}

// correct syntax: ORDER FINLI 2330
export function parseSnsSubscriptionEvent(event: SnsSubscriptionEvent): EstimateSubscription | null {
    const parts = event.messageBody.split(' ');

    if (parts.length < 3) {
        console.error(`method=parseSnsSubscriptionEvent Invalid message ${event.messageBody}`);
        return null;
    }

    return {
        phoneNumber: event.originationNumber,
        locode: parts[1].toLowerCase(),
        time: parts[2]
    };
}

export function parseSnsSubscriptionRemovalEvent(event: SnsSubscriptionEvent): EstimateRemoval | null {
    const parts = event.messageBody.split(' ');

    if (parts.length < 2) {
        console.error(`method=parseSnsSubscriptionRemovalEvent Invalid message ${event.messageBody}`);
        return null;
    }

    return {
        phoneNumber: event.originationNumber,
        locode: parts[1].toLowerCase()
    };
}
