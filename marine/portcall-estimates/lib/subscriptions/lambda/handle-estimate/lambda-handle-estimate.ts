import {SNSEvent} from 'aws-lambda';
import * as SubscriptionsService from '../../service/subscriptions';

export async function handler(event: SNSEvent) {
    const snsEvent = JSON.parse(event.Records[0].Sns.Message) as any[];

    for (const event of snsEvent) {
        await SubscriptionsService.updateSubscriptionEstimates(event.ship_imo, event.location_locode);
    }
}