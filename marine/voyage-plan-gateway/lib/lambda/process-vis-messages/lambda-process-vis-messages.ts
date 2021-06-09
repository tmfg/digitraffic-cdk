import {SQS} from "aws-sdk";
import {VoyagePlanEnvKeys, VoyagePlanSecretKeys} from "../../keys";
import {withSecret} from "digitraffic-common/secrets/secret";
import * as VisApi from '../../api/vis';
import {VisMessageType} from "../../api/vis";
import {VisMessageWithCallbackEndpoint} from "../../model/vismessage";
const crypto = require('crypto');

const secretId = process.env[VoyagePlanEnvKeys.SECRET_ID] as string;
const queueUrl = process.env[VoyagePlanEnvKeys.QUEUE_URL] as string;

const MessageGroupId = 'VPGW-MessageGroupId';

export function handlerFn(
    sqs: SQS,
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any
): () => Promise<void> {
    return async function(): Promise<void> {
        return await doWithSecret(secretId, async (secret: any) => {

            const privateVisUrl = secret[VoyagePlanSecretKeys.PRIVATE_VIS_URL] as string;
            const appId = secret[VoyagePlanSecretKeys.APP_ID];
            const apiKey = secret[VoyagePlanSecretKeys.API_KEY];
            const messages = await VisApi.getMessages(privateVisUrl, appId, apiKey);

            const routeMessages = messages.message.filter(msg => msg.messageType == VisMessageType.RTZ);
            // Do these contain failed authentications?
            const txtMessages = messages.message.filter(msg => msg.messageType == VisMessageType.TXT);

            console.info(`method=vpgwProcessVisMessages count=${messages.message.length}`);

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
                    MessageBody: JSON.stringify(message),
                    MessageGroupId,
                    MessageDeduplicationId: createRtzHash(routeMessage.stmMessage.message)
                }).promise();
            }
        });
    };
}

export const handler = handlerFn(new SQS(), withSecret);

function createRtzHash(rtz: string): string {
    return crypto.createHash("sha256").update(rtz).digest("hex");
}
