import moment from 'moment-timezone';
import {ITask} from "pg-promise";

import * as SubscriptionDB from '../db/db-subscriptions';
import * as ShiplistDb from "../db/db-shiplist";
import {DbShipsToNotificate, DbSubscription} from "../db/db-subscriptions";
import {EstimateRemoval, EstimateSubscription, TIME_FORMAT, validateSubscription} from "../model/subscription";
import {inTransaction} from "../../../../../common/postgres/database";
import {ShiplistEstimate} from "../db/db-shiplist";
import {getStartTime} from "../timeutil";
import {PinpointService, default as pinpointService} from "./pinpoint";
import {selectBestEstimate} from "../../event-sourceutil";

export const DYNAMODB_TIME_FORMAT = 'HHmm';

const SEND_NOTIFICATION_DIFFERENCE_MINUTES = 60;
const VALID_EVENT_TYPES = ["ETA", "ETD"];

export enum SubscriptionType {
    VESSEL_LIST= "VESSEL_LIST"
}

export function _createAddSubscription(pps: PinpointService): (subscription: EstimateSubscription) => Promise<any> {
    return async (subscription: EstimateSubscription): Promise<any> => {
        if (validateSubscription(subscription)) {
            console.log(`Adding subscription for LOCODE ${subscription.locode}, at time ${subscription.time}`);

            const existingSubscriptions = await SubscriptionDB.getSubscriptionList(subscription.phoneNumber);
            if (existingSubscriptions.Items?.length >= 10) {
                return await pps.sendSubscriptionLimitReached(subscription.phoneNumber);
            }

            await SubscriptionDB.insertSubscription({
                Time: moment(subscription.time, TIME_FORMAT, true).format(DYNAMODB_TIME_FORMAT),
                Type: SubscriptionType.VESSEL_LIST,
                Locode: subscription.locode.toUpperCase(),
                PhoneNumber: subscription.phoneNumber
            });

            await pps.sendSubscriptionOKMessage(subscription.phoneNumber);
        } else {
            await pps.sendValidationFailedMessage(subscription.phoneNumber);
            console.error('Invalid subscription');
        }
    };
}
export const addSubscription = _createAddSubscription(pinpointService);

export function _createRemoveSubscription(pps: PinpointService): (removal: EstimateRemoval) => Promise<any> {
    return async (removal: EstimateRemoval) => {
        console.log(`Removing subscription for LOCODE ${removal.locode}`);

        await SubscriptionDB.removeSubscription(removal.phoneNumber, removal.locode);
        await pps.sendRemovalOKMessage(removal.phoneNumber);
    };
}
export const removeSubscription = _createRemoveSubscription(pinpointService);

export function _createSendSubscriptionList(pps: PinpointService): (destinationNumber: string) => Promise<any> {
    return async (destinationNumber: string): Promise<any> => {
        const dbSubs = await SubscriptionDB.getSubscriptionList(destinationNumber);
        const subs = (dbSubs.Items as DbSubscription[])?.map(s => `${s.Locode} ${s.Time}`).join('\n');
        if (dbSubs.Items?.length) {
            await pps.sendSmsMessage(subs, destinationNumber);
        } else {
            await pps.sendNoSubscriptionsMessage(destinationNumber);
        }
    };
}
export const sendSubscriptionList = _createSendSubscriptionList(pinpointService);

export async function listSubscriptions(time: string): Promise<any> {
    const value = await SubscriptionDB.listSubscriptionsForTime(time);
    return value.Items;
}

export async function updateSubscriptionNotifications(
    phoneNumber: string,
    locode: string,
    estimates: ShiplistEstimate[]): Promise<any> {

    const notification = updateEstimates(estimates, {});

//    console.info("got list %s to notifications %s", JSON.stringify(estimates), JSON.stringify(notification));

    return SubscriptionDB.updateNotifications(phoneNumber, locode, notification);
}

export async function updateSubscriptionEstimates(imo: number, locode: string): Promise<any> {
    const startTime = Date.now();

    try {
        console.info("updating estimates for %s %d", locode, imo);

        const subscriptions = await SubscriptionDB.listSubscriptionsForLocode(locode);

        for await (const s of subscriptions.Items) {
            await updateSubscription(imo, s);
            console.info("update subscription %s awaited", locode);
        }
    } finally {
        console.log("updateSubscriptionEstimates took %d ms", Date.now() - startTime);
    }
}

async function updateSubscription(imo: number, s: DbSubscription): Promise<any> {
    const startTime = new Date();
    const endTime = getStartTime(s.Time);

    endTime.setDate(endTime.getDate() + 1);

    console.info("updating subscription %s", s.Locode);

    const estimates = await inTransaction(async (t: ITask<any>) => await ShiplistDb.findByLocodeAndImo(t, startTime, endTime, s.Locode, imo));

    console.info("got estimates %s", JSON.stringify(estimates));

    if (estimates.length > 0 && s.ShipsToNotificate != null) {
        const newNotifications = updateEstimates(estimates, s.ShipsToNotificate);

        await sendSmsNotications(newNotifications, s.PhoneNumber);
        await SubscriptionDB.updateNotifications(s.PhoneNumber, s.Locode, newNotifications);

        console.info("notifications updated");
    }
}

export function _createSendSmsNotications(pps: PinpointService): (notification: DbShipsToNotificate, phoneNumber: string) => Promise<any> {
    return async (notification: DbShipsToNotificate, phoneNumber: string): Promise<any> => {
        for (const key of Object.keys(notification)) {
            const portcall_id = Number(key);
            for (const eventType of Object.keys(notification[portcall_id])?.filter(key => VALID_EVENT_TYPES.includes(key))) {
                const data = notification[portcall_id][eventType];
                const shipName = notification[portcall_id].name;

                const bestEstimate = selectBestEstimate(data);

                if (data.Sent) {
                    const sent = moment(data.Sent);

                    const difference = moment.duration(sent.diff(bestEstimate.time));

                    if (isNotificationNeeded(sent, bestEstimate.time)) {
                        console.info("difference for %s is %s (%s), must send notification", shipName, difference, bestEstimate.source);

                        await pps.sendDifferenceNotification(phoneNumber, shipName, eventType, bestEstimate.time, bestEstimate.source);

                        console.info("notification sent!");
                        data.Sent = bestEstimate.time;
                    }
                } else {
                    console.info("A new estimate in window %s %s %s (%s)", portcall_id, eventType, shipName, bestEstimate.source);

                    await pps.sendDifferenceNotification(phoneNumber, shipName, eventType, bestEstimate.time, bestEstimate.source);

                    console.info("new notification sent!");
                    data.Sent = bestEstimate.time;
                }
            }
        }
    }
}
export const sendSmsNotications = _createSendSmsNotications(pinpointService);

function isNotificationNeeded(sent: moment.Moment, bestEstimate: moment.Moment): boolean {
    const difference = moment.duration(sent.diff(bestEstimate));

    return Math.abs(difference.as('minutes')) >= SEND_NOTIFICATION_DIFFERENCE_MINUTES;
}

export function updateEstimates(estimates: ShiplistEstimate[], notification: DbShipsToNotificate): DbShipsToNotificate {
    console.info("notification to update %s", JSON.stringify(notification));

    const populateSentWithEstimate = Object.keys(notification).length == 0;

    estimates.filter(e => {
        return e.portcall_id != null
    }).forEach(e => {
        const ship = notification[e.portcall_id] || {};
        const event = ship[e.event_type] || {};

        event[e.event_source] = moment(e.event_time).toISOString();

        if(populateSentWithEstimate) {
            event.Sent = selectBestEstimate(event).time;
        } else {
            event.Sent = event.Sent;
        }

        ship.name = e.ship_name;
        ship[e.event_type] = event;
        notification[e.portcall_id] = ship;
    });

    return notification;
}