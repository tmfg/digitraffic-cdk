import {EstimateSubscription} from "../../model/subscription";
import {addSubscription} from "../../service/subscriptions";
import {SubscriptionLocale} from "../../smsutils";

export async function handler(event: EstimateSubscription) {
    // currenly no way to detect locale here
    return await addSubscription(event, SubscriptionLocale.ENGLISH);
}
