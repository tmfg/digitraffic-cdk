import * as SubscriptionsService from "../../service/subscriptions";
import * as ShiplistService from "../../service/shiplist";
import {default as pinpointService} from "../../service/pinpoint";
import * as SnsService from "../../service/sns";
import {ShiplistEstimate} from "../../db/db-shiplist";

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
                await SubscriptionsService.updateSubscriptionNotifications(s.PhoneNumber, s.Locode, estimates),
                await pinpointService.sendShiplist(convertToSms(s.Locode, estimates), s.PhoneNumber),
                await SnsService.sendEmail(convertToSms(s.Locode, estimates))
            ]);
        }));
}

function convertToSms(locode: string, estimates: ShiplistEstimate[]): string {
    let currentDate = new Date();

    const shiplist = estimates.map(e => {
        let timestring = moment(e.event_time).format("HH:mm");

        if(!isSameDate(currentDate, e.event_time)) {
            currentDate = e.event_time;

            timestring = moment(e.event_time).format("D.MM HH:mm")
        }

        return `${e.event_type} ${e.event_source} ${timestring} ${e.ship_name}`; }
    ).join('\n');

    return `Laivalista ${moment().format("DD.MM")} ${locode}:\n${shiplist}`;
}

function isSameDate(date1: Date, date2: Date): boolean {
    return moment(date1).format("D.MM") === moment(date2).format("D.MM");
}

