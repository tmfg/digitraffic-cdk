import {SNS} from "aws-sdk";
import {VoyagePlanEnvKeys, VoyagePlanSecretKeys} from "../../keys";
import {withSecret} from "digitraffic-common/secrets/secret";
import * as VisApi from '../../api/vis';
import {VisMessageType} from "../../api/vis";

export function handlerFn(
    sns: SNS,
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any
): () => Promise<void> {
    return async function(): Promise<void> {
        return await doWithSecret(VoyagePlanEnvKeys.SECRET_ID, async (secret: any) => {

            const publicVisUrl = secret[VoyagePlanSecretKeys.PUBLIC_VIS_URL] as string;
            const hmac = secret[VoyagePlanSecretKeys.HMAC];
            const messages = await VisApi.getMessages(publicVisUrl, hmac);

            const routeMessages = messages.message.filter(msg => msg.messageType == VisMessageType.RTZ);
            // Do these contain failed authentications?
            const txtMessages = messages.message.filter(msg => msg.messageType == VisMessageType.TXT);

            // The total amount of messages should always be one
            const totalMessageAmount = routeMessages.concat(txtMessages).length > 1;
            if (totalMessageAmount) {
                console.warn('method=vpgwProcessVisMessages More than 1 message received count=%d', totalMessageAmount);
            }

            txtMessages.forEach(msg => console.info('method=vpgwProcessVisMessages Received TXT message: %s', msg.stmMessage));
        });
    };
}

export const handler = handlerFn(new SNS(), withSecret);
