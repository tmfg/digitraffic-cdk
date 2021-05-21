/**
 * Implementation for the Sea Traffic Management (STM) Voyage Information Service (VIS) STM Module Notify interface.
 * https://www.seatrafficmanagement.info/developers-forum/vis/
 */

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

export async function handler(event: NotifyEvent): Promise<{statusCode: string}> {
    return {
        statusCode: '204'
    };
}
