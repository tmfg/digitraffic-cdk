import {Pinpoint} from 'aws-sdk';
import {SubscriptionLocale} from "../smsutils";

const pinpoint = new Pinpoint();

const projectId = process.env['PINPOINT_ID'] as string;
const originationNumber = process.env['PINPOINT_NUMBER'] as string;

const MESSAGE_HELP_FI = `Tee tilaus lähettämällä viesti TILAA LOCODE KELLONAIKA, esim. TILAA FIKOK 07:00. Katsele tekemiäsi tilauksia viestillä LISTAA. Poista tilaus viestillä POISTA LOCODE.`
const MESSAGE_HELP_EN = 'Subscribe by sending a message SUBSCRIBE LOCODE TIME, e.g. SUBSCRIBE FIKOK 07:00. View existing subscriptions by sending LIST. Remove subscriptions by sending REMOVE LOCODE.';

const MESSAGE_SUBSCRIPTION_OK_FI = 'Tilaus vastaanotettu.';
const MESSAGE_SUBSCRIPTION_OK_EN = 'Subscription received.';

const MESSAGE_REMOVAL_OK_FI = 'Tilaus poistettu.';
const MESSAGE_REMOVAL_OK_EN = 'Subscription removed.';

const MESSAGE_VALIDATION_FAILED_FI = 'Odottamaton virhe!';
const MESSAGE_VALIDATION_FAILED_EN = 'An unexpected error has occurred!';

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
    destinationNumber: string,
    locale: SubscriptionLocale): Promise<any> {

    return await sendSmsMessage(
        locale == SubscriptionLocale.FINNISH ? MESSAGE_HELP_FI : MESSAGE_HELP_EN,
        destinationNumber);
}

export async function sendSubscriptionOKMessage(
    destinationNumber: string,
    locale: SubscriptionLocale): Promise<any> {
    return await sendSmsMessage(
        locale == SubscriptionLocale.FINNISH ? MESSAGE_SUBSCRIPTION_OK_FI : MESSAGE_SUBSCRIPTION_OK_EN,
        destinationNumber);
}

export async function sendRemovalOKMessage(
    destinationNumber: string,
    locale: SubscriptionLocale): Promise<any> {
    return await sendSmsMessage(
        locale == SubscriptionLocale.FINNISH ? MESSAGE_REMOVAL_OK_FI : MESSAGE_REMOVAL_OK_EN,
        destinationNumber);
}

export async function sendValidationFailedMessage(
    destinationNumber: string,
    locale: SubscriptionLocale): Promise<any> {

    return await sendSmsMessage(
        locale == SubscriptionLocale.FINNISH ? MESSAGE_VALIDATION_FAILED_FI : MESSAGE_VALIDATION_FAILED_EN,
        destinationNumber);
}

export async function sendShiplist(shiplist: string, destinationNumber: string) {
    return await sendSmsMessage(shiplist, destinationNumber);
}
