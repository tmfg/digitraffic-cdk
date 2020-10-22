import {EstimateRemoval, EstimateSubscription, SnsSubscriptionEvent} from './model/subscription';

export enum SubscriptionLocale {
    FINNISH, ENGLISH
}

export enum SubscriptionOperation {
    INVALID, SUBSCRIBE, REMOVE, HELP, LIST
}

export interface SubscriptionLocaleOperation {
    readonly locale: SubscriptionLocale
    readonly operation: SubscriptionOperation
}

export function parseOperation(event: SnsSubscriptionEvent): SubscriptionLocaleOperation {
    const operationString = event.messageBody.split(' ')[0].toUpperCase();

    switch(operationString) {
        case 'SUBSCRIBE':
            return {
                locale: SubscriptionLocale.ENGLISH,
                operation: SubscriptionOperation.SUBSCRIBE
            };
        case 'TILAA':
            return {
                locale: SubscriptionLocale.FINNISH,
                operation: SubscriptionOperation.SUBSCRIBE
            };
        case 'POISTA':
            return {
                locale: SubscriptionLocale.FINNISH,
                operation: SubscriptionOperation.REMOVE
            };
        case 'REMOVE':
            return {
                locale: SubscriptionLocale.ENGLISH,
                operation: SubscriptionOperation.REMOVE
            };
        case 'HELP':
            return {
                locale: SubscriptionLocale.ENGLISH,
                operation: SubscriptionOperation.HELP
            };
        case 'APUA':
            return {
                locale: SubscriptionLocale.FINNISH,
                operation: SubscriptionOperation.HELP
            };
        case 'LISTAA':
            return {
                locale: SubscriptionLocale.FINNISH,
                operation: SubscriptionOperation.LIST
            };
        case 'LIST':
            return {
                locale: SubscriptionLocale.ENGLISH,
                operation: SubscriptionOperation.LIST
            };
        default:
            return {
                locale: SubscriptionLocale.ENGLISH,
                operation: SubscriptionOperation.INVALID
            };
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
