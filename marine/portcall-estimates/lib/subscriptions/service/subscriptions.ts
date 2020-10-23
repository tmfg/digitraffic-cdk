import {EstimateRemoval, EstimateSubscription, TIME_FORMAT, validateSubscription} from "../model/subscription";
import moment from 'moment-timezone';
import {IDatabase} from "pg-promise";
import * as PinpointService from "./pinpoint";
import * as SubscriptionDB from '../db/db-subscriptions';
import {sendSubscriptionOKMessage, sendRemovalOKMessage} from "./pinpoint";
import {DbSubscription} from "../db/db-subscriptions";
import * as ShiplistDb from "../db/db-shiplist";
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {ShiplistEstimate} from "../db/db-shiplist";
import {SubscriptionLocale} from "../smsutils";
import {getStartTime} from "../timeutil";

export const DYNAMODB_TIME_FORMAT = 'HHmm';

export enum SubscriptionType {
    VESSEL_LIST= "VESSEL_LIST"
}

export async function addSubscription(
    subscription: EstimateSubscription,
    locale: SubscriptionLocale) {

    if (validateSubscription(subscription)) {
        console.log(`Adding subscription for LOCODE ${subscription.locode}, at time ${subscription.time}`);
        await SubscriptionDB.insertSubscription({
            Time: moment(subscription.time, TIME_FORMAT, true).format(DYNAMODB_TIME_FORMAT),
            Type: SubscriptionType.VESSEL_LIST,
            Locode: subscription.locode.toUpperCase(),
            PhoneNumber: subscription.phoneNumber
        });

        await sendSubscriptionOKMessage(subscription.phoneNumber, locale);
    } else {
        await PinpointService.sendValidationFailedMessage(subscription.phoneNumber, locale);
        console.error('Invalid subscription');
    }
}

export async function removeSubscription(
    removal: EstimateRemoval,
    locale: SubscriptionLocale) {

    console.log(`Removing subscription for LOCODE ${removal.locode}`);

    await SubscriptionDB.removeSubscription(removal.phoneNumber, removal.locode);
    await sendRemovalOKMessage(removal.phoneNumber, locale);
}

export async function sendSubscriptionList(
    destinationNumber: string,
    locale: SubscriptionLocale) {

    const dbSubs = await SubscriptionDB.getSubscriptionList(destinationNumber);
    const subs = (dbSubs.Items as DbSubscription[])?.map(s => `${s.Locode} ${s.Time}`).join('\n');
    if (dbSubs.Items?.length) {
        await PinpointService.sendSmsMessage(subs, destinationNumber);
    } else {
        await PinpointService.sendNoSubscriptionsMessage(destinationNumber, locale);
    }
}

export async function listSubscriptions(time: string): Promise<any> {
    const value = await SubscriptionDB.listSubscriptionsForTime(time);

    return value.Items;
}

export async function updateSubscriptionNotifications(
    phoneNumber: string,
    locode: string,
    estimates: ShiplistEstimate[]): Promise<any> {

    const notification = {};

    updateEstimates(notification, estimates);

//    console.info("got list %s to notifications %s", JSON.stringify(estimates), JSON.stringify(notification));

    return await SubscriptionDB.updateNotifications(phoneNumber, locode, notification);
}

export function updateSubscriptionEstimates(imo: number, locode: string) {
    SubscriptionDB.listSubscriptionsForLocode(locode).then(subscriptions => {
        subscriptions.Items.forEach((s: DbSubscription) => {
            updateSubscription(imo, s);
        });
    });
}

function updateSubscription(imo: number, s: DbSubscription) {
    const startTime = getStartTime(s.Time);

    inDatabase(async (db: IDatabase<any, any>) => {
        return await ShiplistDb.findByLocodeAndImo(db, startTime, s.Locode, imo);
    }).then(estimates => {
        console.info("got estimates %s", JSON.stringify(estimates));

        if (estimates.length > 0 && s.ShipsToNotificate != null) {
            updateEstimates(s.ShipsToNotificate, estimates);

            sendSmsNotications(s);
            SubscriptionDB.updateNotifications(s.PhoneNumber, s.Locode, s.ShipsToNotificate).then(_ => {
                console.info("notifications updated");
            });
        }
    }).finally(() => {
       console.info("updateSubscriptions final!");
    });
}

function sendSmsNotications(subscription: DbSubscription) {
    const notification = subscription.ShipsToNotificate;

    Object.keys(notification)?.forEach((portcall_id: string) => {
        Object.keys(notification[portcall_id])?.forEach((eventType: string) => {
            const data = notification[portcall_id][eventType];

            const portnet = data.Portnet ? moment(data.Portnet) : null;
            const vts = data.VTS ? moment(data.VTS) : null;
            const sent = moment(data.Sent);

//            console.info("ship %s event %s portnet %s vts %s sent %s", portcall_id, eventType, portnet, vts, sent);

            const bestEstimate = vts || portnet as moment.Moment;
            const difference = moment.duration(sent.diff(bestEstimate));

            if(Math.abs(difference.hours()) >= 1) {
                console.info("difference is %s, must send notification", difference);
                PinpointService.sendDifferenceNotification(subscription.PhoneNumber, notification[portcall_id].name, eventType, bestEstimate);
                data.Sent = bestEstimate?.toISOString();
            }
        });
    });
}

function updateEstimates(notification: any, estimates: ShiplistEstimate[]) {
    console.info("new estimates %s", JSON.stringify(estimates));
    console.info("notification to update %s", JSON.stringify(notification));

    estimates.filter(e => {
        return e.portcall_id != null
    }).forEach(e => {
        const ship = notification[e.portcall_id] || {};
        const event = ship[e.event_type] || {};

        event[e.event_source] = moment(e.event_time).toISOString();
        event.Sent = event.Sent || event.VTS || event.Portnet;

        ship.name = e.ship_name;
        ship[e.event_type] = event;
        notification[e.portcall_id] = ship;
    });
}