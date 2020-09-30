import * as SubscriptionsService from "../../service/subscriptions";
import * as EstimatesService from "../../../estimates/service/estimates";
import * as PinpointService from "../../service/pinpoint";

const moment = require('moment-timezone');

export async function handler() {
    const time = moment.tz(new Date(), "Europe/Helsinki").format(SubscriptionsService.DYNAMODB_TIME_FORMAT);
    const subscriptions = await SubscriptionsService.listSubscriptions(time);

    console.log("active subscriptions for %s %d", time, subscriptions.length);

    await Promise.allSettled(sendShipLists(subscriptions));
}

function sendShipLists(subscriptions: any[]): Promise<any>[] {
    return subscriptions
        .map(async s => {
            const shiplist = await EstimatesService.getShiplist(s.Time, s.Locode);
            return await PinpointService.sendShiplist(shiplist, s.PhoneNumber);
        });
}
