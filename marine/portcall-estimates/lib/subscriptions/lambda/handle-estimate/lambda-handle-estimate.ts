import {SNSEvent} from 'aws-lambda';
import * as SubscriptionsService from '../../service/subscriptions';

export async function handler(event: SNSEvent) {
    const snsEvent = JSON.parse(event.Records[0].Sns.Message) as any[];

    console.info("got event " + JSON.stringify(snsEvent));

    return Promise.allSettled(snsEvent.map(event => {
        const imo = event.ship_imo;
        const locode = event.location_locode;

        return SubscriptionsService.updateSubscriptionEstimates(imo, locode);
    }));
}