import {EstimateSubscription} from "../../model/subscription";
import {addSubscription} from "../../service/subscriptions";
import {parseSnsSubscriptionEvent} from "../../smsutils";
import {SNSEvent} from "aws-lambda";

export async function handler(event: SNSEvent | EstimateSubscription) {
    if (isSnsEvent(event)) {
        const snsEvent = JSON.parse((event as SNSEvent).Records[0].Sns.Message);
        const snsSubscription = parseSnsSubscriptionEvent(snsEvent);
        if (!snsSubscription) {
            // don't log originating number
            // warns are logged by parseSnsSubscriptionEvent
            throw new Error('Invalid SNS subscription');
        }
        return await addSubscription(snsSubscription);
    } else if (isApiEvent(event)) {
        return await addSubscription(event as EstimateSubscription);
    } else {
        throw new Error('Invalid event');
    }
}

function isSnsEvent(event: any) {
    return event.hasOwnProperty('Records');
}

function isApiEvent(event: any) {
    return event.hasOwnProperty('time') &&
        event.hasOwnProperty('locode') &&
        event.hasOwnProperty('phoneNumber');
}
