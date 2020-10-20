import {EstimateSubscription, TIME_FORMAT, validateSubscription} from "../model/subscription";
import moment, {Moment} from 'moment';

const { v4: uuidv4 } = require('uuid');
import * as PinpointService from "./pinpoint";
import * as SubscriptionDB from '../db/db-subscriptions';
import {sendOKMessage} from "./pinpoint";
import {DbSubscription} from "../db/db-subscriptions";
import {ShiplistEstimate} from "../db/db-shiplist";

export const DYNAMODB_TIME_FORMAT = 'HHmm';

export enum SubscriptionType {
    VESSEL_LIST= "VESSEL_LIST"
}

export async function addSubscription(subscription: EstimateSubscription) {
    if (validateSubscription(subscription)) {
        console.log(`Adding subscription for LOCODE ${subscription.locode}, at time ${subscription.time}`);
        await SubscriptionDB.insertSubscription({
            ID: uuidv4(),
            Time: moment(subscription.time, TIME_FORMAT, true).format(DYNAMODB_TIME_FORMAT),
            Type: SubscriptionType.VESSEL_LIST,
            Locode: subscription.locode.toUpperCase(),
            PhoneNumber: subscription.phoneNumber
        });

        await sendOKMessage(subscription.phoneNumber);
    } else {
        await PinpointService.sendValidationFailedMessage(subscription.phoneNumber);
        console.error('Invalid subscription');
    }
}

export async function sendSubscriptionList(destinationNumber: string) {
    const dbSubs = await SubscriptionDB.getSubscriptionList(destinationNumber);
    const subs = (dbSubs.Items as DbSubscription[])?.map(s => `${s.Locode} ${s.Time}`).join('\n');

    await PinpointService.sendSmsMessage(subs, destinationNumber);
}

export async function listSubscriptions(time: string): Promise<any> {
    const value = await SubscriptionDB.listSubscriptionsForTime(time);

    return value.Items;
}

export async function updateSubscriptionNotifications(id: string, estimates: ShiplistEstimate[]): Promise<any> {
    const notifications = createNotifications(estimates);

    console.info("got list %s to notifications %s", JSON.stringify(estimates), JSON.stringify(notifications));

    return await SubscriptionDB.updateNotifications(id, notifications);
}

function createNotifications(estimates: ShiplistEstimate[]): any {
    const notificationMap = {} as any;
    const currentDate = moment().toISOString();

    estimates.forEach(e => {
        const ship = notificationMap[e.ship_imo] || {};

        ship[e.event_type] = {
            'Sent' : currentDate
        }

        ship[e.event_type][e.event_source] = moment(e.event_time).toISOString();

        notificationMap[e.ship_imo] = ship;
    });

    return notificationMap;
}

export function updateSubscriptionEstimates(imo: string, locode: string): Promise<any> {
    console.info("new estimate for %s on %s", imo, locode);

    return Promise.resolve();
}
