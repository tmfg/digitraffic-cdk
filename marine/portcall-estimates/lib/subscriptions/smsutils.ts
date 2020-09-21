import {EstimateSubscription, SnsSubscriptionEvent} from './model/subscription';
import moment from 'moment';

const SUBSCRIBE_OPERATION = 'tilaa';
const LOCODE_PATTERN = /[a-zA-Z]{2}[a-zA-Z0-9]{3}/;
export const TIME_FORMAT = 'H:m';

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

    const locode = parts[1].toLowerCase();
    if (!LOCODE_PATTERN.test(locode)) {
        console.warn(`Not an locode ${operation}, event ${event.messageBody}`);
        return null;
    }

    const timeStr = parts[2];
    const time = moment(timeStr, TIME_FORMAT, true);
    if (!time.isValid()) {
        console.warn(`Not a valid time ${timeStr}, event ${event.messageBody}`);
        return null;
    }

    return {
        phoneNumber: event.originationNumber,
        locode,
        time
    };
}