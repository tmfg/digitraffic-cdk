import moment, {Moment} from 'moment';

export interface EstimateSubscription {
    readonly phoneNumber: string
    readonly locode: string
    readonly time: string
}

export interface EstimateRemoval {
    readonly phoneNumber: string
    readonly locode: string
}

export interface SnsSubscriptionEvent {
    readonly originationNumber: string
    readonly messageBody: string
}

const LOCODE_PATTERN = /[a-zA-Z]{2}[a-zA-Z0-9]{3}/;
export const TIME_FORMAT = ['H:m', 'H'];

export function validateSubscription(subscription: EstimateSubscription): boolean {
    if (!LOCODE_PATTERN.test(subscription.locode)) {
        console.error(`Not an locode ${subscription.locode}`);
        return false;
    }

    const time = moment(subscription.time, TIME_FORMAT, true);
    if (!time.isValid()) {
        console.error(`Not a valid time ${subscription.time}`);
        return false;
    }

    return true;
}