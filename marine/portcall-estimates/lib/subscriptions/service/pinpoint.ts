import {Pinpoint} from 'aws-sdk';

const pinpoint = new Pinpoint();

const projectId = process.env['PINPOINT_ID'] as string;
const originationNumber = process.env['PINPOINT_NUMBER'] as string;

const MESSAGE_HELP = 'Tee tilaus lähettämällä viesti TILAA LOCODE KELLONAIKA, esim. TILAA FIKOK 07:00.';
const MESSAGE_OK = 'Tilaus vastaanotettu';
const MESSAGE_VALIDATION_FAILED = 'Odottamaton virhe!';

export async function sendMessage(body: string, number: string): Promise<any> {
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
        .then(() => console.info('method=sendMessage SMS sent'));
}

export async function sendHelpMessage(destinationNumber: string): Promise<any> {
    return await sendMessage(MESSAGE_HELP, destinationNumber);
}

export async function sendOKMessage(destinationNumber: string): Promise<any> {
    return await sendMessage(MESSAGE_OK, destinationNumber);
}

export async function sendValidationFailedMessage(destinationNumber: string): Promise<any> {
    return await sendMessage(MESSAGE_VALIDATION_FAILED, destinationNumber);
}