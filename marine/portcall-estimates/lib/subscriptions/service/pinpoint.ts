import {Pinpoint} from 'aws-sdk';
import moment from 'moment-timezone';
import * as InfoService from './info';

const pinpoint = new Pinpoint();

const projectId = process.env['PINPOINT_ID'] as string;
const originationNumber = process.env['PINPOINT_NUMBER'] as string;

const MESSAGE_HELP = 'Subscribe by sending a message ORDER LOCODE TIME, e.g. ORDER FIKOK 0700. View existing subscriptions by sending LIST. Remove subscriptions by sending REMOVE LOCODE.';
const MESSAGE_SUBSCRIPTION_OK = 'Order received.';
const MESSAGE_REMOVAL_OK = 'Subscription removed.';
const MESSAGE_NO_SUBSCRIPTIONS = 'No subscriptions.';
const MESSAGE_SUBSCRIPTION_LIMIT_REACHED = 'Maximum number of subscriptions reached.';
const MESSAGE_VALIDATION_FAILED = 'An unexpected error has occurred!';

export interface PinpointService {

    sendSmsMessage(body: string, number: string): Promise<any>

    sendHelpMessage(destinationNumber: string): Promise<any>

    sendDifferenceNotification(
        destinationNumber: string,
        shipName: string,
        eventType: string,
        newTime: moment.Moment,
        eventSource: string
    ): Promise<any>

    sendSubscriptionOKMessage(destinationNumber: string): Promise<any>

    sendRemovalOKMessage(destinationNumber: string): Promise<any>

    sendValidationFailedMessage(destinationNumber: string): Promise<any>

    sendShiplist(shiplist: string, destinationNumber: string): Promise<any>

    sendNoSubscriptionsMessage(destinationNumber: string): Promise<any>

    sendSubscriptionLimitReached(destinationNumber: string): Promise<any>
}

const defaultPinpoint: PinpointService = {

    sendSmsMessage: async (body: string, number: string): Promise<any> => {
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

//        console.info('method=sendMessage, Sending SMS');

        try {
            await pinpoint.sendMessages(params).promise()
            await InfoService.increaseSmsSentAmount();
        } catch(error) {
            console.error(`method=sendMessage error=${error}`)
        }
    },

    sendHelpMessage: async (destinationNumber: string): Promise<any>  => {
        return await defaultPinpoint.sendSmsMessage(MESSAGE_HELP, destinationNumber);
    },

    sendDifferenceNotification: async (
        destinationNumber: string,
        shipName: string,
        eventType: string,
        newTime: moment.Moment,
        eventSource: string
    ): Promise<any> => {
        const timeAsString = moment(newTime).tz('Europe/Helsinki').format("HH:mm");

        return await defaultPinpoint.sendSmsMessage( `${shipName} new ${eventType} ${timeAsString} ${eventSource}`, destinationNumber);
    },

    sendSubscriptionOKMessage: async (destinationNumber: string): Promise<any> => {
        return await defaultPinpoint.sendSmsMessage(MESSAGE_SUBSCRIPTION_OK, destinationNumber);
    },

    sendRemovalOKMessage: async (destinationNumber: string): Promise<any> => {
        return await defaultPinpoint.sendSmsMessage(MESSAGE_REMOVAL_OK, destinationNumber);
    },

    sendValidationFailedMessage: async (destinationNumber: string): Promise<any> => {
        return await defaultPinpoint.sendSmsMessage(MESSAGE_VALIDATION_FAILED, destinationNumber);
    },

    sendShiplist: async (shiplist: string, destinationNumber: string): Promise<any> => {
        return await defaultPinpoint.sendSmsMessage(shiplist, destinationNumber);
    },

    sendNoSubscriptionsMessage: async (destinationNumber: string): Promise<any> => {
        return await defaultPinpoint.sendSmsMessage(MESSAGE_NO_SUBSCRIPTIONS, destinationNumber);
    },

    sendSubscriptionLimitReached: async (destinationNumber: string): Promise<any> => {
        return await defaultPinpoint.sendSmsMessage(MESSAGE_SUBSCRIPTION_LIMIT_REACHED, destinationNumber);
    }
};

export default defaultPinpoint;
