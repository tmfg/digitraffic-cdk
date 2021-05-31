import {SNS, SQS} from "aws-sdk";
import {VoyagePlanEnvKeys, VoyagePlanSecretKeys} from "../../keys";
import {withSecret} from "digitraffic-common/secrets/secret";
import * as VisApi from '../../api/vis';
import {VisMessageType} from "../../api/vis";
import {VisMessageWithCallbackEndpoint} from "../../model/vismessage";

const queueUrl = process.env[VoyagePlanEnvKeys.QUEUE_URL] as string;

export function handlerFn(
    sqs: SQS,
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any
): () => Promise<void> {
    return async function(): Promise<void> {
        return await doWithSecret(VoyagePlanEnvKeys.SECRET_ID, async (secret: any) => {

            const publicVisUrl = secret[VoyagePlanSecretKeys.PUBLIC_VIS_URL] as string;
            const appId = secret[VoyagePlanSecretKeys.APP_ID];
            const apiKey = secret[VoyagePlanSecretKeys.API_KEY];
            const messages = await VisApi.getMessages(publicVisUrl, appId, apiKey);

            const routeMessages = messages.message.filter(msg => msg.messageType == VisMessageType.RTZ);
            // Do these contain failed authentications?
            const txtMessages = messages.message.filter(msg => msg.messageType == VisMessageType.TXT);

            if (messages.remainingNumberOfMessages > 50) {
                console.warn('method=vpgwProcessVisMessages More than 50 messages remain in queue count=%d',
                    messages.remainingNumberOfMessages);
            }

            txtMessages.forEach(msg =>
                console.info('method=vpgwProcessVisMessages Received TXT message: %s',msg.stmMessage));

            for (const routeMessage of routeMessages) {
                const message: VisMessageWithCallbackEndpoint = {
                    callbackEndpoint: routeMessage.CallbackEndpoint,
                    message: routeMessage.stmMessage.message
                };
                await sqs.sendMessage({
                    QueueUrl: queueUrl,
                    MessageBody: JSON.stringify(message)
                }).promise();
            }
        });
    };
}

export const handler = handlerFn(new SQS(), withSecret);
