import {EstimateSubscription, TIME_FORMAT, validateSubscription} from "../model/subscription";
import moment, {Moment} from 'moment';
import {IDatabase} from "pg-promise";

const { v4: uuidv4 } = require('uuid');
import * as PinpointService from "./pinpoint";
import * as SubscriptionDB from '../db/db-subscriptions';
import {sendOKMessage} from "./pinpoint";
import {DbSubscription} from "../db/db-subscriptions";
import * as ShiplistDb from "../db/db-shiplist";
import {inDatabase} from "../../../../../common/postgres/database";
import {ShiplistEstimate} from "../db/db-shiplist";
import {SubscriptionLocale} from "../smsutils";

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
            ID: uuidv4(),
            Time: moment(subscription.time, TIME_FORMAT, true).format(DYNAMODB_TIME_FORMAT),
            Type: SubscriptionType.VESSEL_LIST,
            Locode: subscription.locode.toUpperCase(),
            PhoneNumber: subscription.phoneNumber
        });

        await sendOKMessage(subscription.phoneNumber, locale);
    } else {
        await PinpointService.sendValidationFailedMessage(subscription.phoneNumber, locale);
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

export function updateSubscriptionEstimates(imo: number, locode: string) {
    console.info("new estimate for %s on %s", imo, locode);

    SubscriptionDB.listSubscriptionsForLocode(locode).then(subscriptions => {
        console.info("got subscriptions %d", subscriptions.Items.length);

        subscriptions.Items.forEach((s: DbSubscription) => {
            updateSubscription(locode, imo, s);
        });
    }).finally(() => {
        console.info("updateSubscriptionEstimates final!");
    });
}

function updateSubscription(locode: string, imo: number, s: DbSubscription) {
    console.info("moikkamoi3!");

    inDatabase(async (db: IDatabase<any, any>) => {
        return await ShiplistDb.findByLocodeAndImo(db, locode, imo);
    }).then(estimates => {
        console.info("got estimates %s", JSON.stringify(estimates));

        if (s.ShipsToNotificate == null) {
            console.info("subscription %s has no notifications", s.ID);
        } else {
            console.info("notifications %s", JSON.stringify(s.ShipsToNotificate));

            const imoNotification = s.ShipsToNotificate[imo.toString()];

            console.info("notification to update %s", JSON.stringify(imoNotification));
        }
    }).finally(() => {
       console.info("updateSubscriptions final!");
    });
}