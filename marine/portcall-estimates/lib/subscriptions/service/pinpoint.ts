import {Pinpoint} from 'aws-sdk';

const pinpoint = new Pinpoint();

const projectId = process.env["PINPOINT_ID"] as string;
const originationNumber = process.env["PINPOINT_NUMBER"] as string;

const MESSAGE_HELP = "this is help!";
const MESSAGE_OK = "Ok.";
const MESSAGE_VALIDATION_FAILED = "Validation failed";

async function sendMessage(body: string, number: string): Promise<any> {
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
                    MessageType: "TRANSACTIONAL",
                    OriginationNumber: originationNumber
                }
            }
        }
    };

    console.info("sending sms message");
    return await pinpoint.sendMessages(params).promise()
        .catch(() => console.info("error!"))
        .then(() => console.info("done!"));
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