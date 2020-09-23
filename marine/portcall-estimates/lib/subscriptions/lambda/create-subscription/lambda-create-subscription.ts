import {EstimateSubscription, SnsSubscriptionEvent} from "../../model/subscription";
import {addSubscription} from "../../service/subscriptions";
import {parseOperation, parseSnsSubscriptionEvent, SubscriptionOperation} from "../../smsutils";
import {SNSEvent} from "aws-lambda";
import {sendHelpMessage, sendOKMessage} from "../../service/pinpoint";

export async function handler(event: SNSEvent | EstimateSubscription) {
    if (isSnsEvent(event)) {
        const snsEvent = JSON.parse((event as SNSEvent).Records[0].Sns.Message);
        const operation = parseOperation(snsEvent);

        return await handle(operation, snsEvent);
    } else if (isApiEvent(event)) {
        return await addSubscription(event as EstimateSubscription);
    } else {
        throw new Error('Invalid event');
    }
}

async function handle(operation: SubscriptionOperation, event: SnsSubscriptionEvent): Promise<any> {
    console.info("handle " + operation);

    switch (operation) {
        case SubscriptionOperation.INVALID:
        case SubscriptionOperation.HELP:
            return await sendHelpMessage(event.originationNumber);
        case SubscriptionOperation.REMOVE:
            // TODO
            break;
        case SubscriptionOperation.SUBSCRIBE:
            const snsSubscription = parseSnsSubscriptionEvent(event);

            if(!snsSubscription) {
                return await sendHelpMessage(event.originationNumber);
            }

            return Promise.all([addSubscription(snsSubscription), sendOKMessage(event.originationNumber)]);
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
