import {SNSEvent} from 'aws-lambda';
import * as SubscriptionsService from '../../service/subscriptions';

export function handler(event: SNSEvent) {
    const snsEvent = JSON.parse(event.Records[0].Sns.Message) as any[];

    snsEvent.forEach((event: any) => {
        SubscriptionsService.updateSubscriptionEstimates(event.ship_imo, event.location_locode);
    });
}