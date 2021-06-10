/**
 * Implementation for the Sea Traffic Management (STM) Voyage Information Service (VIS) STM Module Notify interface.
 * https://www.seatrafficmanagement.info/developers-forum/vis/
 */

import {SNS} from "aws-sdk";
import {VoyagePlanEnvKeys} from "../../keys";

const topicArn = process.env[VoyagePlanEnvKeys.TOPIC_ARN] as string;

export enum NotificationType {
    MESSAGE_WAITING = 'MESSAGE_WAITING',
    UNAUTHORIZED_REQUEST = 'UNAUTHORIZED_REQUEST',
    ACKNOWLEDGEMENT_RECEIVED = 'ACKNOWLEDGEMENT_RECEIVED',
    ERROR_MESSAGE = 'ERROR_MESSAGE'
}

type NotifyEvent = {
    // Notification body, optional
    readonly Body?: string

    // Identity of the notification and the stored message which can be retrieved with
    // "getMessage(dataId)"
    readonly DataId: string

    readonly FromId: string

    // Friendly name of sender for presentation
    readonly FromName: string

    // >0 if a message is waiting in server, otherwise 0
    readonly MessageWaiting: number

    // Notification created at date and time
    readonly NotificationCreatedAt: string

    // Type of notification by enumeration
    readonly NotificationType: NotificationType

    // Date and time for the reception of the message
    readonly ReceivedAt: string

    // Notification subject
    readonly Subject: string
}

export function handlerFn(sns: SNS): (e: NotifyEvent) => Promise<any> {
    return async (event: NotifyEvent): Promise<{statusCode: string}> => {
        if (event.MessageWaiting > 50) {
            console.warn('method=vpgwVisNotify More than 50 messages waiting, processing messages anyway');
        }
        if (event.MessageWaiting > 100) {
            console.error('method=vpgwVisNotify More than 100 messages waiting, not processing any more messages');
            return Promise.reject('Too many messages waiting');
        }

        // trigger a Lambda invocation per message
        await sns.publish({
            TopicArn: topicArn,
            Message: 'EMPTY' // a non-empty message is needed
        }).promise();

        return {
            statusCode: '204'
        };
    }
}

export const handler = handlerFn(new SNS());
