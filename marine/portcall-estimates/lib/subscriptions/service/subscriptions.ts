import {EstimateRemoval, EstimateSubscription, TIME_FORMAT, validateSubscription} from "../model/subscription";
import moment from 'moment-timezone';
import {IDatabase} from "pg-promise";
import * as SubscriptionDB from '../db/db-subscriptions';
import {DbShipsToNotificate, DbSubscription} from "../db/db-subscriptions";
import * as ShiplistDb from "../db/db-shiplist";
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {ShiplistEstimate} from "../db/db-shiplist";
import {getStartTime} from "../timeutil";
import {PinpointService, default as pinpointService} from "./pinpoint";

export const DYNAMODB_TIME_FORMAT = 'HHmm';

const SEND_NOTIFICATION_DIFFERENCE_MINUTES = 15;
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

    const notification = updateEstimates(estimates);

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
            const newNotifications = updateEstimates(estimates);

            sendSmsNotications(newNotifications, s.PhoneNumber);
            SubscriptionDB.updateNotifications(s.PhoneNumber, s.Locode, newNotifications).then(_ => {
                console.info("notifications updated");
            });
        }
    }).finally(() => {
       console.info("updateSubscriptions final!");
    });
}

function _createSendSmsNotications(pps: PinpointService): (notification: DbShipsToNotificate, phoneNumber: string) => Promise<any> {
    return async (notification: DbShipsToNotificate, phoneNumber: string): Promise<any> => {
        Object.keys(notification)?.forEach((key: string) => {
            const portcall_id = Number(key);
            Object.keys(notification[portcall_id])?.filter(key => VALID_EVENT_TYPES.includes(key)).forEach((eventType: string) => {
                const data = notification[portcall_id][eventType];

                const portnet = data.Portnet ? moment(data.Portnet) : null;
                const vts = data.VTS ? moment(data.VTS) : null;
                const bestEstimate = vts || portnet as moment.Moment;

                if (data.Sent) {
                    const sent = moment(data.Sent);

//            console.info("ship %s event %s portnet %s vts %s sent %s", portcall_id, eventType, portnet, vts, sent);

                    const difference = moment.duration(sent.diff(bestEstimate));

                    if (isNotificationNeeded(sent, bestEstimate)) {
                        console.info("difference is %s, must send notification", difference);
                        pps.sendDifferenceNotification(phoneNumber, notification[portcall_id].name, eventType, bestEstimate);
                        data.Sent = bestEstimate.toISOString();
                    }
                } else {
                    console.info("A new estimate in window %s %s %s", portcall_id, eventType, JSON.stringify(notification));
                    pps.sendDifferenceNotification(phoneNumber, notification[portcall_id].name, eventType, bestEstimate);
                    data.Sent = bestEstimate.toISOString();
                }
            });
        });
    };
}
export const sendSmsNotications = _createSendSmsNotications(pinpointService);

function isNotificationNeeded(sent: moment.Moment, bestEstimate: moment.Moment): boolean {
    const difference = moment.duration(sent.diff(bestEstimate));

    return Math.abs(difference.minutes()) >= SEND_NOTIFICATION_DIFFERENCE_MINUTES;
}

function updateEstimates(estimates: ShiplistEstimate[]): DbShipsToNotificate {
    const notification: DbShipsToNotificate = {};
    console.info("new estimates %s", JSON.stringify(estimates));

    console.info("notification to update %s", JSON.stringify(notification));

    const updateSent = notification == {};

    estimates.filter(e => {
        return e.portcall_id != null
    }).forEach(e => {
        const ship = notification[e.portcall_id] || {};
        const event = ship[e.event_type] || {};

        event[e.event_source] = moment(e.event_time).toISOString();

        if(updateSent) {
            event.Sent = event.Sent || event.VTS || event.Portnet;
        } else {
            event.Sent = event.Sent;
        }

        ship.name = e.ship_name;
        ship[e.event_type] = event;
        notification[e.portcall_id] = ship;
    });

    return notification;
}