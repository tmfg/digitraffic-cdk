import {Pinpoint} from 'aws-sdk';
import moment from 'moment-timezone';

const pinpoint = new Pinpoint();

const projectId = process.env['PINPOINT_ID'] as string;
const originationNumber = process.env['PINPOINT_NUMBER'] as string;

const MESSAGE_HELP = 'Subscribe by sending a message SUBSCRIBE LOCODE TIME, e.g. SUBSCRIBE FIKOK 07:00. View existing subscriptions by sending LIST. Remove subscriptions by sending REMOVE LOCODE.';
const MESSAGE_SUBSCRIPTION_OK = 'Subscription received.';
const MESSAGE_REMOVAL_OK = 'Subscription removed.';
const MESSAGE_NO_SUBSCRIPTIONS = 'No subscriptions.';
const MESSAGE_SUBSCRIPTION_LIMIT_REACHED = 'Maximum number of subscriptions reached.';
const MESSAGE_VALIDATION_FAILED = 'An unexpected error has occurred!';

export async function sendSmsMessage(body: string, number: string): Promise<any> {
    const params = {
        ApplicationId: projectId,
        MessageRequest: {
            Addresses: {
                [number]: {
                    ChannelType: 'SMS'
                }
            },
            MessageConfiguration: {
                SMSMessage: {
                    Body: body,
                    MessageType: 'TRANSACTIONAL',
                    OriginationNumber: originationNumber
                }
            }
        }
    };

    console.info('method=sendMessage, Sending SMS');
    return await pinpoint.sendMessages(params).promise()
        .catch((error: Error) => console.error(`method=sendMessage error=${error}`))
}

export async function sendHelpMessage(
    destinationNumber: string): Promise<any> {
    return await sendSmsMessage(MESSAGE_HELP, destinationNumber);
}

export async function sendDifferenceNotification(
    destinationNumber: string,
    shipName: string,
    eventType: string,
    newTime: moment.Moment
): Promise<any> {
    const timeAsString = newTime.format("HH:mm");

    return await(sendSmsMessage(destinationNumber, `Ship ${shipName} ${eventType} has a new estimate ${timeAsString}`));
}

export async function sendSubscriptionOKMessage(
    destinationNumber: string): Promise<any> {
    return await sendSmsMessage(MESSAGE_SUBSCRIPTION_OK, destinationNumber);
}

export async function sendRemovalOKMessage(
    destinationNumber: string): Promise<any> {
    return await sendSmsMessage(MESSAGE_REMOVAL_OK, destinationNumber);
}

export async function sendValidationFailedMessage(
    destinationNumber: string): Promise<any> {
    return await sendSmsMessage(MESSAGE_VALIDATION_FAILED, destinationNumber);
}

export async function sendShiplist(shiplist: string, destinationNumber: string) {
    return await sendSmsMessage(shiplist, destinationNumber);
}

export async function sendNoSubscriptionsMessage(
    destinationNumber: string): Promise<any> {
    return await sendSmsMessage(MESSAGE_NO_SUBSCRIPTIONS, destinationNumber);
}

export async function sendSubscriptionLimitReached(
    destinationNumber: string): Promise<any> {
    return await sendSmsMessage(MESSAGE_SUBSCRIPTION_LIMIT_REACHED, destinationNumber);
}