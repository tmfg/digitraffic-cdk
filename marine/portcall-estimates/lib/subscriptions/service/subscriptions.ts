import {EstimateSubscription, validateSubscription} from '../model/subscription';

export async function addSubscription(
    subscription: EstimateSubscription) {

    if (validateSubscription(subscription)) {
        console.log(`Adding subscription for LOCODE ${subscription.locode}, at time ${subscription.time}`);
    } else {
        console.error('Invalid subscription');
    }
}
