import * as SubscriptionsService from "../../service/subscriptions";
import * as ShiplistService from "../../service/shiplist";
import * as PinpointService from "../../service/pinpoint";
import * as SnsService from "../../service/sns";

const moment = require('moment-timezone');

export async function handler() {
    const time = moment.tz(new Date(), "Europe/Helsinki").format(SubscriptionsService.DYNAMODB_TIME_FORMAT);
    const subscriptions = await SubscriptionsService.listSubscriptions(time);

    console.log("active subscriptions for %s %d", time, subscriptions.length);

    return await sendShipLists(subscriptions);
}

async function sendShipLists(subscriptions: any[]): Promise<any> {
    return Promise.allSettled(subscriptions
        .map(async s => {
            const estimates = await ShiplistService.getEstimates(s.Time, s.Locode);

            return Promise.all([
                await SubscriptionsService.updateSubscriptionNotifications(s.ID, estimates),
                await SnsService.sendEstimatesEmail(s.Locode, estimates)
            ]);
//            return await PinpointService.sendShiplist(shiplist, s.PhoneNumber);
        }));
}

