import {SnsSubscriptionEvent} from '../../model/subscription';
import {addSubscription, removeSubscription, sendSubscriptionList} from '../../service/subscriptions';
import {
    parseOperation,
    parseSnsSubscriptionEvent, parseSnsSubscriptionRemovalEvent,
    SubscriptionOperation
} from '../../smsutils';
import {SNSEvent} from 'aws-lambda';
import {sendHelpMessage} from '../../service/pinpoint';

export async function handler(event: SNSEvent) {
    const snsEvent = JSON.parse((event as SNSEvent).Records[0].Sns.Message);
    const operation = parseOperation(snsEvent);
    return await handleSms(operation, snsEvent);
}

export async function handleSms(op: SubscriptionOperation, event: SnsSubscriptionEvent): Promise<any> {
    console.info(`method=handleSms operation: ${op}`);
    switch (op) {
        case SubscriptionOperation.INVALID:
            console.error('method=handleSms, Invalid subscription operation');
            return Promise.reject('Invalid subscription operation');
        case SubscriptionOperation.HELP:
            return await sendHelpMessage(event.originationNumber);
        case SubscriptionOperation.REMOVE:
            const snsSubscriptionRemoval = parseSnsSubscriptionRemovalEvent(event);
            if(!snsSubscriptionRemoval) {
                return await sendHelpMessage(event.originationNumber);
            }
            return await removeSubscription(snsSubscriptionRemoval);
        case SubscriptionOperation.LIST:
            return await sendSubscriptionList(event.originationNumber);
        case SubscriptionOperation.SUBSCRIBE:
            const snsSubscription = parseSnsSubscriptionEvent(event);
            if(!snsSubscription) {
                return await sendHelpMessage(event.originationNumber);
            }
            return await addSubscription(snsSubscription);
    }
}
