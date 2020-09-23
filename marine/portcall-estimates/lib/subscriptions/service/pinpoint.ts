import {Pinpoint} from 'aws-sdk';

const pinpoint = new Pinpoint();

const projectId = process.env["PINPOINT_ID"] as string;
const originationNumber = process.env["PINPOINT_NUMBER"] as string;
const OK_MESSAGE = "Ok.";
const VALIDATION_FAILED_MESSAGE = "Validation failed";

export async function sendOKMessage(destinationNumber: string) {
    const params = {
        ApplicationId: projectId,
        MessageRequest: {
            Addresses: {
                [destinationNumber]: {
                    ChannelType: 'SMS'
                }
            },
            MessageConfiguration: {
                SMSMessage: {
                    Body: OK_MESSAGE,
                    MessageType: "TRANSACTIONAL",
                    OriginationNumber: originationNumber
                }
            }
        }
    };

    console.info("sending sms ok message");
    await pinpoint.sendMessages(params).promise()
        .catch(() => console.info("error!"))
        .then(() => console.info("done!"));
}

export async function sendValidationFailedMessage(destinationNumber: string) {
    const params = {
        ApplicationId: projectId,
        MessageRequest: {
            Addresses: {
                [destinationNumber]: {
                    ChannelType: 'SMS'
                }
            },
            MessageConfiguration: {
                SMSMessage: {
                    Body: VALIDATION_FAILED_MESSAGE,
                    MessageType: "TRANSACTIONAL",
                    OriginationNumber: originationNumber
                }
            }
        }
    };

    console.info("sending sms failed message")
    await pinpoint.sendMessages(params).promise()
        .catch(() => console.info("error!"))
        .then(() => console.info("done!"));
}