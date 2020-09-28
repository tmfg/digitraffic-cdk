import {EstimateSubscription} from "../../model/subscription";
import {addSubscription} from "../../service/subscriptions";

export async function handler(event: EstimateSubscription) {
    return await addSubscription(event);
}
