import {EstimateSubscription} from "../model/subscription";
import {TIME_FORMAT} from "../smsutils";

export async function addSubscription(subscription: EstimateSubscription) {
    console.log(`Adding subscription for LOCODE ${subscription.locode}, at time ${subscription.time.format(TIME_FORMAT)}`);
}
