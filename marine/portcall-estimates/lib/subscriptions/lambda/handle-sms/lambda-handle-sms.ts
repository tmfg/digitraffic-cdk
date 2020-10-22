import {SnsSubscriptionEvent} from '../../model/subscription';
import {addSubscription, sendSubscriptionList} from '../../service/subscriptions';
import {
    parseOperation,
    parseSnsSubscriptionEvent,
    SubscriptionLocaleOperation,
    SubscriptionOperation
} from '../../smsutils';
import {SNSEvent} from 'aws-lambda';
import {sendHelpMessage} from '../../service/pinpoint';

export async function handler(event: SNSEvent) {
    const snsEvent = JSON.parse((event as SNSEvent).Records[0].Sns.Message);
    const operation = parseOperation(snsEvent);
    return await handleSms(operation, snsEvent);
}

export async function handleSms(locop: SubscriptionLocaleOperation, event: SnsSubscriptionEvent): Promise<any> {
    console.info(`method=handleSms operation: ${locop.operation}`);
    switch (locop.operation) {
        case SubscriptionOperation.INVALID:
            console.error('method=handleSms, Invalid subscription operation');
            return Promise.reject('Invalid subscription operation');
        case SubscriptionOperation.HELP:
            return await sendHelpMessage(event.originationNumber, locop.locale);
        case SubscriptionOperation.REMOVE:
            // TODO
            break;
        case SubscriptionOperation.LIST:
            return await sendSubscriptionList(event.originationNumber);
        case SubscriptionOperation.SUBSCRIBE:
            const snsSubscription = parseSnsSubscriptionEvent(event);
            if(!snsSubscription) {
                return await sendHelpMessage(event.originationNumber, locop.locale);
            }
            return await addSubscription(snsSubscription, locop.locale);
    }
}
