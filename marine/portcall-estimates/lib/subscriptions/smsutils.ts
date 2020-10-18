import {EstimateSubscription, SnsSubscriptionEvent} from './model/subscription';

export enum SubscriptionOperation {
    INVALID, SUBSCRIBE, REMOVE, HELP, LIST
}

export function parseOperation(event: SnsSubscriptionEvent): SubscriptionOperation {
    const operationString = event.messageBody.split(' ')[0].toUpperCase();

    switch(operationString) {
        case 'SUBSCRIBE':
        case 'TILAA':
            return SubscriptionOperation.SUBSCRIBE;
        case 'POISTA':
        case 'REMOVE':
            return SubscriptionOperation.REMOVE;
        case 'HELP':
        case 'APUA':
            return SubscriptionOperation.HELP;
        case 'LISTAA':
        case 'LIST':
            return SubscriptionOperation.LIST;
        default:
            return SubscriptionOperation.INVALID;
    }
}

// correct syntax: TILAA FINLI 23:30
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
